/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ExceptionInvalidValuesException = require('./Exception/InvalidValuesException');

var _ramlSanitize = require('raml-sanitize');

var _ramlSanitize2 = _interopRequireDefault(_ramlSanitize);

var _ramlValidate = require('raml-validate');

var _ramlValidate2 = _interopRequireDefault(_ramlValidate);

var _PathTransformer = require('./PathTransformer');

var _promptSync = require('prompt-sync');

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _util = require('util');

var Schema = (function () {
  /**
   * @param {Object} ramlModel
   */

  function Schema(ramlModel) {
    _classCallCheck(this, Schema);

    this._validator = (0, _ramlValidate2['default'])()(ramlModel);
    this._sanitizer = (0, _ramlSanitize2['default'])()(ramlModel);

    this._ramlModel = ramlModel;
  }

  /**
   * @returns {Object}
   */

  _createClass(Schema, [{
    key: 'sanitize',

    /**
     * @param {Object} obj
     * @returns {Object}
     */
    value: function sanitize(obj) {
      return this._sanitizer(obj);
    }

    /**
     * @param {Object} obj
     * @returns {Object}
     */
  }, {
    key: 'validate',
    value: function validate(obj) {
      return this._validator(obj);
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'extractInteractive',
    value: function extractInteractive() {
      var obj = {};

      for (var key in this._ramlModel) {
        if (!this._ramlModel.hasOwnProperty(key)) {
          continue;
        }

        var def = this._ramlModel[key];

        Schema._showQuestionInfo(key, def);

        obj[key] = (0, _promptSync.prompt)() || def['default'];
      }

      return this.extract(obj);
    }

    /**
     * @param {String} key
     * @param {Object} def
     * @returns {String}
     * @private
     */
  }, {
    key: 'extract',

    /**
     * @param {Object} rawObj
     * @returns {Object}
     */
    value: function extract(rawObj) {
      var obj = this.sanitize((0, _util._extend)({}, rawObj));
      var result = this.validate(obj);

      if (!result.valid) {
        throw new _ExceptionInvalidValuesException.InvalidValuesException(result.errors);
      }

      return new _PathTransformer.PathTransformer().transform(obj);
    }
  }, {
    key: 'ramlModel',
    get: function get() {
      return this._ramlModel;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'sanitizer',
    get: function get() {
      return this._sanitizer;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'validator',
    get: function get() {
      return this._validator;
    }
  }], [{
    key: '_showQuestionInfo',
    value: function _showQuestionInfo(key, def) {
      var name = def.displayName || key;
      var example = (def.example ? '@example \'' + def.example + '\'' : null) || '';
      var defaultValue = def['default'] ? '@default \'' + def['default'] + '\'' : null;

      console.log(new Array(name.length + 1).join('_'));
      console.log(name);
      console.log(defaultValue || example);
      console.log(def.required ? '@required' : '@optional');
    }
  }]);

  return Schema;
})();

exports.Schema = Schema;