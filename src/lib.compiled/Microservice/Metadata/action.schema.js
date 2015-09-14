/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Action = require('./Action');

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _HelpersJoiHelper = require('../../Helpers/JoiHelper');

exports['default'] = _joi2['default'].object().keys({
  description: _HelpersJoiHelper.JoiHelper.maybeString(),
  type: _HelpersJoiHelper.JoiHelper.stringEnum([_Action.Action.LAMBDA, _Action.Action.EXTERNAL]),
  methods: _HelpersJoiHelper.JoiHelper.listEnum(_Action.Action.HTTP_VERBS),
  source: _HelpersJoiHelper.JoiHelper.string()
});
module.exports = exports['default'];