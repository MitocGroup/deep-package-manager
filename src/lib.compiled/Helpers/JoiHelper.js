/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

/**
 * Abstraction on Joi validation expressions
 */

var JoiHelper = (function () {
  function JoiHelper() {
    _classCallCheck(this, JoiHelper);
  }

  _createClass(JoiHelper, null, [{
    key: "list",

    /**
     * List expression
     *
     * @returns {*}
     */
    value: function list() {
      return _joi2["default"].array().required();
    }

    /**
     * List expression with predefined values
     *
     * @param {Array} cases
     * @returns {*}
     */
  }, {
    key: "listEnum",
    value: function listEnum(cases) {
      return JoiHelper.list().allow(cases);
    }

    /**
     * String expression with predefined values
     *
     * @param {Array} cases
     * @returns {*}
     */
  }, {
    key: "stringEnum",
    value: function stringEnum(cases) {
      return JoiHelper.string().allow(cases);
    }

    /**
     * Array of strings expression
     *
     * @returns {*}
     */
  }, {
    key: "stringArray",
    value: function stringArray() {
      return JoiHelper.array().items(_joi2["default"].string());
    }

    /**
     * String or nothing expression
     *
     * @returns {String}
     */
  }, {
    key: "maybeString",
    value: function maybeString() {
      return _joi2["default"].string().optional();
    }

    /**
     * Semantical versioning expression
     *
     * @returns {*}
     */
  }, {
    key: "semver",
    value: function semver() {
      return JoiHelper.string().regex(/^\d+\.\d+\.\d+([a-zA-Z])?$/);
    }

    /**
     * String expression
     *
     * @returns {*|String}
     */
  }, {
    key: "string",
    value: function string() {
      return _joi2["default"].string().required();
    }

    /**
     * Boolean expression
     *
     * @returns {*}
     */
  }, {
    key: "bool",
    value: function bool() {
      return _joi2["default"].boolean().required();
    }

    /**
     * Alphanumeric expression
     *
     * @returns {*|String}
     */
  }, {
    key: "alnum",
    value: function alnum() {
      return JoiHelper.string().alphanum();
    }

    /**
     * Email expression
     *
     * @returns {*|{type, invalids, rules}}
     */
  }, {
    key: "email",
    value: function email() {
      return JoiHelper.string().email();
    }

    /**
     * Website expression
     *
     * @returns {*|{type, invalids, rules}}
     */
  }, {
    key: "website",
    value: function website() {
      return JoiHelper.string().uri();
    }
  }]);

  return JoiHelper;
})();

exports.JoiHelper = JoiHelper;