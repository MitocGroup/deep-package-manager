/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';
import {SharedAwsConfig} from '../Helpers/SharedAwsConfig';
import exec from 'sync-exec';

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
  appIdentifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/).optional().default(buildPropertyId()),
  env: JoiHelper.stringEnum(['dev', 'stage', 'test', 'prod']).optional().default('dev'),
  awsAccountId: Joi.number().optional().default(guessAwsAccountId()),
  aws: Joi.object().keys({
    accessKeyId: JoiHelper.string().required(),
    secretAccessKey: JoiHelper.string().required(),
    region: JoiHelper.string().required(),
    httpOptions: Joi.object().optional(),
  }).optional().default(guessAwsSdkConfig()),
});

function buildPropertyId() {
  let result = exec(
    process.platform === 'darwin'
      ? 'echo `uname -a``ifconfig``date` | md5'
      : 'echo `uname -a``ifconfig``date` | md5sum | awk "{print $1}"'
  );

  return result.status === 0
    ? result.stdout.toString().replace(/[^a-zA-Z0-9_\.-]+/, '')
    : `your-unique-app-identifier-${new Date().getTime()}`;
}

function guessAwsAccountId() {
  return 123456789012;
}

function guessAwsSdkConfig() {
  return new SharedAwsConfig().guess();
}
