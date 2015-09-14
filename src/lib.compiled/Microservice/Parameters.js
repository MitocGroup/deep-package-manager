/**
 * Created by AlexanderC on 6/17/15.
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

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _parametersSchema = require('./parameters.schema');

var _parametersSchema2 = _interopRequireDefault(_parametersSchema);

var _ExceptionInvalidConfigException = require('./Exception/InvalidConfigException');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ParametersExtractor = require('../Parameters/Extractor');

/**
 * User defined parameters
 */

var Parameters = (function () {
  /**
   * @param {Object} rawParameters
   * @param {String} workingDir
   */

  function Parameters() {
    var rawParameters = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];
    var workingDir = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, Parameters);

    this._rawParameters = rawParameters;
    this._workingDir = workingDir;

    this._parsedObject = _joi2['default'].validate(this._rawParameters, _parametersSchema2['default']);
    this._filledObject = null;
  }

  /**
   * @returns {Object}
   */

  _createClass(Parameters, [{
    key: 'extract',

    /**
     * Extracts parsed configuration
     *
     * @param {String} type
     * @returns {Object}
     */
    value: function extract() {
      var type = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      if (!this.valid) {
        throw new _ExceptionInvalidConfigException.InvalidConfigException(this.error);
      }

      if (!this._filledObject) {
        this._fillParametersObject();
      }

      return type ? this._filledObject[type] : this._filledObject;
    }

    /**
     * @private
     */
  }, {
    key: '_fillParametersObject',
    value: function _fillParametersObject() {
      if (!this.valid) {
        return;
      }

      var paramsObj = this._parsedObject.value;

      if (paramsObj.hasOwnProperty(Parameters.GLOBALS)) {
        paramsObj[Parameters.GLOBALS] = new _ParametersExtractor.Extractor(paramsObj[Parameters.GLOBALS]).extractOptimal(this._workingDir, Parameters.GLOBALS);
      }

      paramsObj[Parameters.FRONTEND] = new _ParametersExtractor.Extractor(paramsObj[Parameters.FRONTEND]).extractOptimal(this._workingDir, Parameters.FRONTEND);
      paramsObj[Parameters.BACKEND] = new _ParametersExtractor.Extractor(paramsObj[Parameters.BACKEND]).extractOptimal(this._workingDir, Parameters.BACKEND);

      this._filledObject = paramsObj;

      // @todo: move this?
      _ParametersExtractor.Extractor.dumpParameters(this._workingDir, paramsObj, true);
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'rawParameters',
    get: function get() {
      return this._rawParameters;
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

    /**
     * Read microservice configuration from json file
     *
     * @param {String} file
     */
    value: function createFromJsonFile(file) {
      var rawParameters = {
        frontend: {},
        backend: {}
      };

      if (_fs2['default'].existsSync(file)) {
        rawParameters = _jsonfile2['default'].readFileSync(file);
      }

      return new Parameters(rawParameters, _path2['default'].dirname(file));
    }
  }, {
    key: 'GLOBALS',
    get: function get() {
      return 'globals';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'FRONTEND',
    get: function get() {
      return 'frontend';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'BACKEND',
    get: function get() {
      return 'backend';
    }
  }]);

  return Parameters;
})();

exports.Parameters = Parameters;