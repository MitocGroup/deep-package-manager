/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _deepckSchema = require('./deepck.schema');

var _deepckSchema2 = _interopRequireDefault(_deepckSchema);

var _ExceptionInvalidConfigException = require('./Exception/InvalidConfigException');

/**
 * Microservice configuration loader
 */

var Config = (function () {
  /**
   * @param {Object} rawConfig
   */

  function Config() {
    var rawConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Config);

    this._rawConfig = rawConfig;

    this._parsedObject = _joi2['default'].validate(this._rawConfig, _deepckSchema2['default']);
  }

  /**
   * @returns {Object}
   */

  _createClass(Config, [{
    key: 'extract',

    /**
     * Extracts parsed configuration
     *
     * @returns {Object}
     */
    value: function extract() {
      if (!this.valid) {
        throw new _ExceptionInvalidConfigException.InvalidConfigException(this.error);
      }

      return this._parsedObject.value;
    }

    /**
     * Read microservice configuration from json file
     *
     * @param {String} file
     */
  }, {
    key: 'rawConfig',
    get: function get() {
      return this._rawConfig;
    }

    /**
     * Validates raw object
     *
     * @returns {Boolean}
     */
  }, {
    key: 'valid',
    get: function get() {
      return !this.error;
    }

    /**
     * Retrieve parse error if available
     *
     * @returns {String}
     */
  }, {
    key: 'error',
    get: function get() {
      return this._parsedObject.error;
    }
  }], [{
    key: 'createFromJsonFile',
    value: function createFromJsonFile(file) {
      var rawConfig = _jsonfile2['default'].readFileSync(file);

      return new Config(rawConfig);
    }
  }]);

  return Config;
})();

exports.Config = Config;