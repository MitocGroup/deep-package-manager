/**
 * Created by mgoria on 7/15/15.
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

var _configSchema = require('./config.schema');

var _configSchema2 = _interopRequireDefault(_configSchema);

var _ExceptionInvalidConfigException = require('./Exception/InvalidConfigException');

/**
 * Application configuration loader
 */

var Config = (function () {
  /**
   * @param {Object} rawConfig
   */

  function Config() {
    var rawConfig = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Config);

    this._rawConfig = rawConfig;

    this._parsedObject = _joi2['default'].validate(this._rawConfig, _configSchema2['default']);
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

      var config = this._parsedObject.value;

      // set aws region as default region into property config
      config.awsRegion = config.aws.region;

      return config;
    }

    /**
     * @returns {String}
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
    key: 'generate',

    /**
     * @returns {Object}
     */
    value: function generate() {
      return _joi2['default'].validate({}, _configSchema2['default']).value;
    }

    /**
     * Read app configuration from json file
     *
     * @param {String} file
     */
  }, {
    key: 'createFromJsonFile',
    value: function createFromJsonFile(file) {
      var rawConfig = _jsonfile2['default'].readFileSync(file);

      return new Config(rawConfig);
    }
  }, {
    key: 'DEFAULT_FILENAME',
    get: function get() {
      return 'deeploy.json';
    }
  }]);

  return Config;
})();

exports.Config = Config;