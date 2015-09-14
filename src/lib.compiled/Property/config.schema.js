/**
 * Created by mgoria on 7/15/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _HelpersJoiHelper = require('../Helpers/JoiHelper');

var _HelpersSharedAwsConfig = require('../Helpers/SharedAwsConfig');

var _syncExec = require('sync-exec');

var _syncExec2 = _interopRequireDefault(_syncExec);

exports['default'] = _joi2['default'].object().keys({
  dependencies: _joi2['default'].object().keys({
    bucket: _HelpersJoiHelper.JoiHelper.string().required(),
    prefix: _HelpersJoiHelper.JoiHelper.string().optional().allow(''),
    aws: _joi2['default'].object().keys({
      accessKeyId: _HelpersJoiHelper.JoiHelper.string().required(),
      secretAccessKey: _HelpersJoiHelper.JoiHelper.string().required(),
      region: _HelpersJoiHelper.JoiHelper.string().required(),
      httpOptions: _joi2['default'].object().optional()
    }).optional()
  }).optional(),
  propertyIdentifier: _HelpersJoiHelper.JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/).optional()['default'](buildPropertyId()),
  env: _HelpersJoiHelper.JoiHelper.stringEnum(['dev', 'stage', 'test', 'prod']).optional()['default']('dev'),
  awsAccountId: _joi2['default'].number().optional()['default'](guessAwsAccountId()),
  aws: _joi2['default'].object().keys({
    accessKeyId: _HelpersJoiHelper.JoiHelper.string().required(),
    secretAccessKey: _HelpersJoiHelper.JoiHelper.string().required(),
    region: _HelpersJoiHelper.JoiHelper.string().required(),
    httpOptions: _joi2['default'].object().optional()
  }).optional()['default'](guessAwsSdkConfig())
});

function buildPropertyId() {
  var result = (0, _syncExec2['default'])(process.platform === 'darwin' ? 'echo `uname -a``ifconfig``date` | md5' : 'echo `uname -a``ifconfig``date` | md5sum | awk "{print $1}"');

  return result.status === 0 ? result.stdout.toString().trim() : 'your-unique-property-identifier';
}

function guessAwsAccountId() {
  return 123456789012;
}

function guessAwsSdkConfig() {
  return new _HelpersSharedAwsConfig.SharedAwsConfig().guess();
}
module.exports = exports['default'];