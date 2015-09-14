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

exports['default'] = _joi2['default'].object().keys({
  globals: _joi2['default'].object().unknown().optional(),
  backend: _joi2['default'].object().unknown(),
  frontend: _joi2['default'].object().unknown()
});
module.exports = exports['default'];