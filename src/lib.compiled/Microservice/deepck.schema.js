/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _HelpersJoiHelper = require('../Helpers/JoiHelper');

var FRONTEND = 'Frontend';
var BACKEND = 'Backend';
var DOCS = 'Docs';
var MODELS = 'Models';

exports['default'] = _joi2['default'].object().keys({
  name: _HelpersJoiHelper.JoiHelper.string(),
  propertyRoot: _HelpersJoiHelper.JoiHelper.bool(),
  identifier: _HelpersJoiHelper.JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/),
  description: _HelpersJoiHelper.JoiHelper.maybeString()['default']('Deep Microservice'),
  version: _HelpersJoiHelper.JoiHelper.semver(),
  author: {
    name: _HelpersJoiHelper.JoiHelper.string(),
    email: _HelpersJoiHelper.JoiHelper.email()
  },
  contributors: _joi2['default'].array().items(_joi2['default'].object().keys({
    name: _HelpersJoiHelper.JoiHelper.string(),
    email: _HelpersJoiHelper.JoiHelper.email()
  })),
  website: _HelpersJoiHelper.JoiHelper.website(),
  email: _HelpersJoiHelper.JoiHelper.email(),
  dependencies: _joi2['default'].object().unknown().pattern(/^[a-zA-Z0-9_-]+$/, _HelpersJoiHelper.JoiHelper.semver()),
  autoload: _joi2['default'].object().keys({
    frontend: _HelpersJoiHelper.JoiHelper.maybeString()['default'](FRONTEND),
    backend: _HelpersJoiHelper.JoiHelper.maybeString()['default'](BACKEND),
    docs: _HelpersJoiHelper.JoiHelper.maybeString()['default'](DOCS),
    models: _HelpersJoiHelper.JoiHelper.maybeString()['default'](MODELS)
  })['default']({
    frontend: FRONTEND,
    backend: BACKEND,
    docs: DOCS,
    models: MODELS
  })
});
module.exports = exports['default'];