/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';
import {SharedAwsConfig} from '../Helpers/SharedAwsConfig';
import exec from 'sync-exec';
import Tmp from 'tmp';
import OS from 'os';
import FileSystem from 'fs';

let guessedAwsCredentials = guessAwsSdkConfig();

export default Joi.object().keys({
  dependencies: Joi.object().keys({
    bucket: JoiHelper.string().required(),
    prefix: JoiHelper.string().optional().allow(''),
    aws: Joi.object().keys({
      accessKeyId: JoiHelper.string().required(),
      secretAccessKey: JoiHelper.string().required(),
      region: JoiHelper.string().required(),
      httpOptions: Joi.object().optional(),
    }).optional(),
  }).optional(),
  appIdentifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/).optional().default(buildAppId()),
  env: JoiHelper.stringEnum(['dev', 'stage', 'test', 'prod']).optional().default('dev'),
  awsAccountId: Joi.number().optional().default(guessAwsAccountId(guessedAwsCredentials)),
  aws: Joi.object().keys({
    accessKeyId: JoiHelper.string().required(),
    secretAccessKey: JoiHelper.string().required(),
    region: JoiHelper.string().required(),
    httpOptions: Joi.object().optional(),
  }).optional().default(guessedAwsCredentials),
});

function buildAppId() {
  let result = exec(
    process.platform === 'darwin'
      ? 'echo `uname -a``ifconfig``date` | md5'
      : 'echo `uname -a``ifconfig``date` | md5sum | awk "{print $1}"'
  );

  return result.status === 0
    ? result.stdout.toString().replace(/[^a-z0-9_\.-]+/gi, '')
    : `unique-app-id-${new Date().getTime()}`;
}

function guessAwsAccountId(awsCredentials) {
  let defaultUserId = 123456789012;

  if (awsCredentials.accessKeyId && awsCredentials.secretAccessKey) {
    let credentialsFile = Tmp.tmpNameSync();

    let credentials = `[profile deep]${OS.EOL}`;
    credentials += `aws_access_key_id=${awsCredentials.accessKeyId}${OS.EOL}`;
    credentials += `aws_secret_access_key=${awsCredentials.secretAccessKey}${OS.EOL}`;

    FileSystem.writeFileSync(credentialsFile, credentials);

    let getUserCommand = `export AWS_CONFIG_FILE=${credentialsFile}; `;
    getUserCommand += `aws --profile deep iam get-user 2>/dev/null`;

    try {
      let userInfoRaw = exec(getUserCommand).stdout.toString().trim();
      let userInfo = JSON.parse(userInfoRaw);

      if (userInfo) {
        return userInfo.User.Arn.replace(/^.*:(\d+):(root|(user\/.*))$/i, '$1') || defaultUserId;
      }
    } catch (e) {
    }
  }

  return defaultUserId;
}

function guessAwsSdkConfig() {
  return new SharedAwsConfig().guess();
}
