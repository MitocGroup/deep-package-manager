/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';
import {SharedAwsConfig} from '../Helpers/SharedAwsConfig';
import {Exec} from '../Helpers/Exec';
import Tmp from 'tmp';
import OS from 'os';
import FileSystem from 'fs';
import {DeployConfig} from './DeployConfig';

/**
 * @returns {Object}
 */
function guessAwsSdkConfig() {
  return new SharedAwsConfig().choose(); // @todo: replace with guess()?
}

/**
 * @param {String} appId
 * @returns {*}
 */
function buildAppNameFromId(appId) {
  return `My Custom Web App ${appId}`;
}

/**
 * @returns {*}
 */
function buildAppId() {
  let result = new Exec(
    process.platform === 'darwin'
      ? 'echo `uname -a``ifconfig``date` | md5'
      : 'echo `uname -a``ifconfig``date` | md5sum | awk "{print $1}"'
  ).runSync();

  return result.succeed
    ? result.result.replace(/[^a-z0-9_\.-]+/gi, '')
    : `unique-app-id-${new Date().getTime()}`;
}

/**
 * @param {Object} awsCredentials
 * @returns {*}
 */
function guessAwsAccountId(awsCredentials) {
  let defaultUserId = 123456789012;

  if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
    let credentialsFile = Tmp.tmpNameSync();

    let credentials = `[profile deep]${OS.EOL}`;
    credentials += `aws_access_key_id=${awsCredentials.accessKeyId}${OS.EOL}`;
    credentials += `aws_secret_access_key=${awsCredentials.secretAccessKey}${OS.EOL}`;

    FileSystem.writeFileSync(credentialsFile, credentials);

    let getUserCommand = `export AWS_CONFIG_FILE=${credentialsFile}; `;
    getUserCommand += 'aws --profile deep iam get-user 2>/dev/null';

    let userInfoResult = new Exec(getUserCommand).runSync();

    if (userInfoResult.failed) {
      return defaultUserId;
    }

    try {
      let userInfo = JSON.parse(userInfoResult.result);

      if (userInfo) {
        return userInfo.User.Arn.replace(/^.*:(\d+):(root|(user\/.*))$/i, '$1') || defaultUserId;
      }
    } catch (e) {
      console.debug('Unable to parse userInfoResult: ', e);
    }
  }

  return defaultUserId;
}

export default {
  validation: () => {
    return Joi.object().keys({
      appName: JoiHelper.string().regex(/^[a-z\s0-9+\-=\._:\/]{1,256}$/i).optional().default('').empty(''),
      appIdentifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/).required(),
      env: JoiHelper.stringEnum(DeployConfig.AVAILABLE_ENV).optional()
        .lowercase().default(DeployConfig.AVAILABLE_ENV[0]),
      awsAccountId: Joi.number().required(),
      domain: Joi.string().optional().lowercase()
        .regex(/^([a-zA-Z0-9-_]+\.)+[a-zA-Z]+?$/i)
        .replace(/^www\./i, ''),
      apiVersion: JoiHelper.string().regex(/^[a-zA-Z0-9_]+$/i).required().default(DeployConfig.DEFAULT_API_VERSION),
      aws: Joi.object().keys({
        accessKeyId: JoiHelper.string().required().empty(''),
        secretAccessKey: JoiHelper.string().required().empty(''),
        sessionToken: JoiHelper.string().optional().empty(''),
        region: JoiHelper.string().required(),
        httpOptions: Joi.object().optional(),
      }).required(),
    })
  },
  generation: () => {
    let guessedAwsCredentials = guessAwsSdkConfig();
    let appId = buildAppId();

    return Joi.object().keys({
      appName: JoiHelper.string().optional().default(buildAppNameFromId(appId)),
      appIdentifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/).optional().default(appId),
      env: JoiHelper.stringEnum(DeployConfig.AVAILABLE_ENV).optional().default(DeployConfig.AVAILABLE_ENV[0]),
      awsAccountId: Joi.number().optional().default(guessAwsAccountId(guessedAwsCredentials)),
      apiVersion: JoiHelper.string().regex(/^[a-zA-Z0-9_]+$/i).required().default(DeployConfig.DEFAULT_API_VERSION),
      aws: Joi.object().keys({
        accessKeyId: JoiHelper.string().required(),
        secretAccessKey: JoiHelper.string().required(),
        sessionToken: JoiHelper.string().optional(),
        region: JoiHelper.string().required(),
        httpOptions: Joi.object().optional(),
      }).optional().default(guessedAwsCredentials),
    })
  }
};
