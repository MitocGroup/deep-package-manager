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

var _Config = require('./Config');

var _Parameters = require('./Parameters');

var _ExceptionInvalidArgumentException = require('../Exception/InvalidArgumentException');

var _MetadataAutoload = require('./Metadata/Autoload');

var _MetadataResourceCollection = require('./Metadata/ResourceCollection');

var _CompilationCompiler = require('../Compilation/Compiler');

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _PostDeployHook = require('./PostDeployHook');

/**
 * Microservice instance
 */

var Instance = (function () {
  /**
   * @param {Config} config
   * @param {Parameters} parameters
   * @param {String} basePath
   */

  function Instance(config, parameters, basePath) {
    _classCallCheck(this, Instance);

    if (!(config instanceof _Config.Config)) {
      throw new _ExceptionInvalidArgumentException.InvalidArgumentException(config, _Config.Config);
    }

    if (!(parameters instanceof _Parameters.Parameters)) {
      throw new _ExceptionInvalidArgumentException.InvalidArgumentException(parameters, _Parameters.Parameters);
    }

    this._basePath = _underscoreString2['default'].rtrim(basePath, '/');
    this._config = config.extract();
    this._parameters = parameters.extract();
    this._autoload = new _MetadataAutoload.Autoload(this._config.autoload, this._basePath);
    this._resources = null;

    this._postDeployHook = new _PostDeployHook.PostDeployHook(this);
  }

  /**
   * @returns {String}
   */

  _createClass(Instance, [{
    key: 'compile',

    /**
     * Compiles dependencies recursively
     *
     * @param {Boolean} lambdasOnly
     */
    value: function compile() {
      var lambdasOnly = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      if (!lambdasOnly) {
        _CompilationCompiler.Compiler.compile(this);
      }

      this._config.lambdas = _CompilationCompiler.Compiler.buildLambdas(this);
    }

    /**
     * @returns {Boolean}
     */
  }, {
    key: 'identifier',

    /**
     * @returns {String}
     */
    get: function get() {
      return this._config.identifier;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'version',
    get: function get() {
      return this._config.version;
    }

    /**
     *
     * @returns {String}
     */
  }, {
    key: 'basePath',
    get: function get() {
      return this._basePath;
    }
  }, {
    key: 'isRoot',
    get: function get() {
      return !!this._config.propertyRoot;
    }

    /**
     * Retrieve microservice configuration
     *
     * @returns {Config}
     */
  }, {
    key: 'config',
    get: function get() {
      return this._config;
    }

    /**
     * @returns {Parameters}
     */
  }, {
    key: 'parameters',
    get: function get() {
      return this._parameters;
    }

    /**
     * @returns {Autoload}
     */
  }, {
    key: 'autoload',
    get: function get() {
      return this._autoload;
    }

    /**
     * @returns {Function}
     */
  }, {
    key: 'postDeployHook',
    get: function get() {
      return this._postDeployHook.getHook();
    }

    /**
     * @returns {ResourceCollection}
     */
  }, {
    key: 'resources',
    get: function get() {
      if (this._resources === null) {
        this._resources = _MetadataResourceCollection.ResourceCollection.create(this._autoload.backend);
      }

      return this._resources;
    }
  }], [{
    key: 'create',

    /**
     * @param {String} basePath
     */
    value: function create(basePath) {
      basePath = _underscoreString2['default'].rtrim(basePath, '/');

      var configFile = basePath + '/' + Instance.CONFIG_FILE;
      var parametersFile = basePath + '/' + Instance.PARAMS_FILE;

      return new Instance(_Config.Config.createFromJsonFile(configFile), _Parameters.Parameters.createFromJsonFile(parametersFile), basePath);
    }
  }, {
    key: 'CONFIG_FILE',
    get: function get() {
      return 'deepkg.json';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'PARAMS_FILE',
    get: function get() {
      return 'parameters.json';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'RESOURCES_FILE',
    get: function get() {
      return 'resources.json';
    }
  }]);

  return Instance;
})();

exports.Instance = Instance;