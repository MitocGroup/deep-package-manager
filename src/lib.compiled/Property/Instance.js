/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _ProvisioningInstance = require('../Provisioning/Instance');

var _ExceptionException = require('../Exception/Exception');

var _ExceptionInvalidArgumentException = require('../Exception/InvalidArgumentException');

var _MicroserviceInstance = require('../Microservice/Instance');

var _ExceptionDuplicateRootException = require('./Exception/DuplicateRootException');

var _ExceptionMissingRootException = require('./Exception/MissingRootException');

var _Lambda = require('./Lambda');

var _HelpersWaitFor = require('../Helpers/WaitFor');

var _Frontend = require('./Frontend');

var _Model = require('./Model');

var _ProvisioningServiceS3Service = require('../Provisioning/Service/S3Service');

var _Config = require('./Config');

var _HelpersHash = require('../Helpers/Hash');

/**
 * Property instance
 */

var Instance = (function () {
  /**
   * @param {String} path
   * @param {String} configFileName
   */

  function Instance(path) {
    var configFileName = arguments.length <= 1 || arguments[1] === undefined ? _Config.Config.DEFAULT_FILENAME : arguments[1];

    _classCallCheck(this, Instance);

    var configFile = _path2['default'].join(path, configFileName);

    if (!_fs2['default'].existsSync(configFile)) {
      throw new _ExceptionException.Exception('Missing ' + configFileName + ' configuration file from ' + path + '.');
    }

    this._config = _Config.Config.createFromJsonFile(configFile).extract();

    // @todo: improve this!
    this._config.deployId = _HelpersHash.Hash.md5(this._config.propertyIdentifier + '#' + new Date().getTime());

    this._aws = _awsSdk2['default'];
    _awsSdk2['default'].config.update(this._config.aws);

    this._path = _underscoreString2['default'].rtrim(path, '/');
    this._microservices = null;
    this._localDeploy = false;
    this._provisioning = new _ProvisioningInstance.Instance(this);
  }

  /**
   * Max number of concurrent async processes to run
   * @returns {number}
   */

  _createClass(Instance, [{
    key: 'fakeBuild',

    /**
     * This is mainly used by dev server!
     *
     * @returns {Object}
     */
    value: function fakeBuild() {
      var microservicesConfig = {};
      var microservices = this.microservices;
      var rootMicroservice;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = microservices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var microservice = _step.value;

          if (microservice.isRoot) {
            if (rootMicroservice) {
              throw new _ExceptionDuplicateRootException.DuplicateRootException(rootMicroservice, microservice);
            }

            // @todo: set it from other place?
            this._config.globals = microservice.parameters.globals || {};

            rootMicroservice = microservice;
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      if (!rootMicroservice) {
        throw new _ExceptionMissingRootException.MissingRootException();
      }

      var modelsDirs = [];

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = microservices[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var microservice = _step2.value;

          microservice.compile();

          var microserviceConfig = {
            identifier: microservice.config.identifier,
            localPath: microservice.basePath,
            resources: microservice.resources.extract(),
            parameters: microservice.parameters,
            raw: microservice.config,
            isRoot: microservice.isRoot,
            autoload: microservice.autoload.extract(),
            lambdas: {},
            deployedServices: {
              lambdas: {}
            }
          };

          microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

          modelsDirs.push(microservice.autoload.models);
        }
      } catch (err) {
        _didIteratorError2 = true;
        _iteratorError2 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion2 && _iterator2['return']) {
            _iterator2['return']();
          }
        } finally {
          if (_didIteratorError2) {
            throw _iteratorError2;
          }
        }
      }

      this._config.microservices = microservicesConfig;

      var models = _Model.Model.create.apply(_Model.Model, modelsDirs);

      this._config.models = models.map(function (m) {
        return m.extract();
      });

      var lambdaInstances = [];

      for (var microserviceIdentifier in this._config.microservices) {
        if (!this._config.microservices.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microservice = this._config.microservices[microserviceIdentifier];

        for (var lambdaIdentifier in microservice.raw.lambdas) {
          if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier)) {
            continue;
          }

          var lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
          var lambdaExecRole = '';

          var lambdaInstance = new _Lambda.Lambda(this, microserviceIdentifier, lambdaIdentifier, microserviceIdentifier + '-' + lambdaIdentifier, lambdaExecRole, lambdaPath);

          this._config.microservices[microserviceIdentifier].lambdas[lambdaIdentifier] = {
            name: lambdaInstance.functionName,
            region: lambdaInstance.region
          };

          lambdaInstances.push(lambdaInstance);
        }
      }

      var lambdas = {};
      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        for (var _iterator3 = lambdaInstances[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          var lambdaInstance = _step3.value;

          lambdas[lambdaInstance.functionName] = lambdaInstance.createConfig(this._config);

          // @todo: remove this hook?
          lambdas[lambdaInstance.functionName].name = lambdaInstance.functionName;
          lambdas[lambdaInstance.functionName].path = _path2['default'].join(lambdaInstance.path, 'bootstrap.js');
        }
      } catch (err) {
        _didIteratorError3 = true;
        _iteratorError3 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion3 && _iterator3['return']) {
            _iterator3['return']();
          }
        } finally {
          if (_didIteratorError3) {
            throw _iteratorError3;
          }
        }
      }

      return lambdas;
    }

    /**
     * @param {Function} callback
     * @param {Boolean} skipProvision
     * @returns {Instance}
     */
  }, {
    key: 'build',
    value: function build(callback, skipProvision) {
      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      console.log('- Start building property: ' + new Date().toTimeString());

      var microservicesConfig = {};
      var microservices = this.microservices;
      var rootMicroservice;

      var _iteratorNormalCompletion4 = true;
      var _didIteratorError4 = false;
      var _iteratorError4 = undefined;

      try {
        for (var _iterator4 = microservices[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
          var microservice = _step4.value;

          if (microservice.isRoot) {
            if (rootMicroservice) {
              throw new _ExceptionDuplicateRootException.DuplicateRootException(rootMicroservice, microservice);
            }

            rootMicroservice = microservice;

            // @todo: set it from other place?
            this._config.globals = microservice.parameters.globals || {};
          }
        }
      } catch (err) {
        _didIteratorError4 = true;
        _iteratorError4 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion4 && _iterator4['return']) {
            _iterator4['return']();
          }
        } finally {
          if (_didIteratorError4) {
            throw _iteratorError4;
          }
        }
      }

      if (!rootMicroservice) {
        throw new _ExceptionMissingRootException.MissingRootException();
      }

      var modelsDirs = [];

      var _iteratorNormalCompletion5 = true;
      var _didIteratorError5 = false;
      var _iteratorError5 = undefined;

      try {
        for (var _iterator5 = microservices[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
          var microservice = _step5.value;

          microservice.compile();

          var microserviceConfig = {
            identifier: microservice.config.identifier,
            localPath: microservice.basePath,
            resources: microservice.resources.extract(),
            parameters: microservice.parameters,
            raw: microservice.config,
            isRoot: microservice.isRoot,
            autoload: microservice.autoload.extract(),
            lambdas: {},
            deployedServices: {
              lambdas: {}
            }
          };

          microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

          modelsDirs.push(microservice.autoload.models);
        }
      } catch (err) {
        _didIteratorError5 = true;
        _iteratorError5 = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion5 && _iterator5['return']) {
            _iterator5['return']();
          }
        } finally {
          if (_didIteratorError5) {
            throw _iteratorError5;
          }
        }
      }

      this._config.microservices = microservicesConfig;

      var models = _Model.Model.create.apply(_Model.Model, modelsDirs);

      this._config.models = models.map(function (m) {
        return m.extract();
      });

      if (skipProvision) {
        callback();
      } else {
        console.log('- Start provisioning: ' + new Date().toTimeString());

        this.provisioning.create((function (config) {
          this._config.provisioning = config;

          console.log('- Provisioning is done!: ' + new Date().toTimeString());

          callback();
        }).bind(this));
      }

      return this;
    }

    /**
     * @param {Function} callback
     * @param {Boolean} isUpdate
     * @returns {Instance}
     */
  }, {
    key: 'deploy',
    value: function deploy(callback) {
      var isUpdate = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      console.log('- Start deploying!: ' + new Date().toTimeString());

      var lambdas = [];
      var lambdaExecRoles = this._config.provisioning.lambda.executionRoles;
      var lambdaNames = this._config.provisioning.lambda.names;

      for (var microserviceIdentifier in this._config.microservices) {
        if (!this._config.microservices.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microservice = this._config.microservices[microserviceIdentifier];

        for (var lambdaIdentifier in microservice.raw.lambdas) {
          if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier)) {
            continue;
          }

          var lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
          var lambdaExecRole = lambdaExecRoles[microserviceIdentifier][lambdaIdentifier];
          var lambdaName = lambdaNames[microserviceIdentifier][lambdaIdentifier];

          var lambdaInstance = new _Lambda.Lambda(this, microserviceIdentifier, lambdaIdentifier, lambdaName, lambdaExecRole, lambdaPath);

          this._config.microservices[microserviceIdentifier].lambdas[lambdaIdentifier] = {
            name: lambdaInstance.functionName,
            region: lambdaInstance.region
          };

          lambdas.push(lambdaInstance);
        }
      }

      var wait = new _HelpersWaitFor.WaitFor();
      var concurrentCount = this.constructor.concurrentAsyncCount;
      var remaining = 0;

      // @todo: setup lambda defaults (memory size, timeout etc.)
      var asyncLambdaActions = lambdas.map((function (lambda) {
        return (function () {
          var deployedLambdasConfig = this._config.microservices[lambda.microserviceIdentifier].deployedServices.lambdas;

          if (isUpdate) {
            if (this._localDeploy) {
              lambda.pack().ready((function () {
                remaining--;
              }).bind(this));
            } else {
              lambda.update((function () {
                deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
                remaining--;
              }).bind(this));
            }
          } else {
            lambda.deploy((function () {
              deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
              remaining--;
            }).bind(this));
          }
        }).bind(this);
      }).bind(this));

      var hasNextBatch = !!asyncLambdaActions.length;

      function processAsyncLambdaBatch() {
        if (asyncLambdaActions.length) {
          var stack = asyncLambdaActions.splice(0, concurrentCount);
          var stackItem = undefined;
          remaining = stack.length;

          var _iteratorNormalCompletion6 = true;
          var _didIteratorError6 = false;
          var _iteratorError6 = undefined;

          try {
            for (var _iterator6 = stack[Symbol.iterator](), _step6; !(_iteratorNormalCompletion6 = (_step6 = _iterator6.next()).done); _iteratorNormalCompletion6 = true) {
              stackItem = _step6.value;

              stackItem();
            }
          } catch (err) {
            _didIteratorError6 = true;
            _iteratorError6 = err;
          } finally {
            try {
              if (!_iteratorNormalCompletion6 && _iterator6['return']) {
                _iterator6['return']();
              }
            } finally {
              if (_didIteratorError6) {
                throw _iteratorError6;
              }
            }
          }

          if (!asyncLambdaActions.length) {
            hasNextBatch = false;
          }
        } else {
          hasNextBatch = false;
        }
      }

      wait.push((function () {
        if (remaining === 0) {
          if (hasNextBatch) {
            processAsyncLambdaBatch();
            return false;
          } else {
            return true;
          }
        }

        return false;
      }).bind(this));

      wait.ready((function () {
        var frontend = new _Frontend.Frontend(this._config.microservices, this._path);
        var publicBucket = this._config.provisioning.s3.buckets[_ProvisioningServiceS3Service.S3Service.PUBLIC_BUCKET].name;

        frontend.build(_Frontend.Frontend.createConfig(this._config));

        if (isUpdate && this._localDeploy) {
          callback();
        } else {
          console.log('- Start deploying frontend!: ' + new Date().toTimeString());
          frontend.deploy(this._aws, publicBucket).ready(callback);
        }
      }).bind(this));

      return this;
    }

    /**
     * @param {Function} callback
     * @param {Boolean} isUpdate
     * @returns {Instance}
     * @private
     */
  }, {
    key: '_postDeploy',
    value: function _postDeploy(callback) {
      var isUpdate = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      if (isUpdate) {
        // @todo - check if we have smth to do in this case
        callback();
      } else {
        this.provisioning.postDeployProvision((function (config) {
          this._config.provisioning = config;
          callback();
        }).bind(this));
      }

      return this;
    }

    /**
     * @param {Object} propertyConfigSnapshot
     * @param {Function} callback
     * @returns {Instance}
     */
  }, {
    key: 'update',
    value: function update(propertyConfigSnapshot, callback) {
      this._config = propertyConfigSnapshot;

      return this.install(callback, true);
    }

    /**
     * @param {Function} callback
     * @param {Boolean} skipProvision
     * @returns {Instance}
     */
  }, {
    key: 'install',
    value: function install(callback, skipProvision) {
      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      console.log('- Start installing property: ' + new Date().toTimeString());

      return this.build((function () {
        this.deploy((function () {
          console.log('- Deploy is done!: ' + new Date().toTimeString());
          this._postDeploy(callback, skipProvision);
        }).bind(this), skipProvision);
      }).bind(this), skipProvision);
    }

    /**
     * @returns {Microservice[]}
     */
  }, {
    key: 'localDeploy',

    /**
     * @returns {Boolean}
     */
    get: function get() {
      return this._localDeploy;
    },

    /**
     * @param {Boolean} state
     */
    set: function set(state) {
      this._localDeploy = state;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'config',
    get: function get() {
      return this._config;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'path',
    get: function get() {
      return this._path;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'identifier',
    get: function get() {
      return this._config.propertyIdentifier;
    }

    /**
     * @returns {AWS}
     */
  }, {
    key: 'AWS',
    get: function get() {
      return this._aws;
    }

    /**
     * @returns {Provisioning}
     */
  }, {
    key: 'provisioning',
    get: function get() {
      return this._provisioning;
    }
  }, {
    key: 'microservices',
    get: function get() {
      if (this._microservices === null) {
        this._microservices = [];

        var files = _fs2['default'].readdirSync(this._path);

        var _iteratorNormalCompletion7 = true;
        var _didIteratorError7 = false;
        var _iteratorError7 = undefined;

        try {
          for (var _iterator7 = files[Symbol.iterator](), _step7; !(_iteratorNormalCompletion7 = (_step7 = _iterator7.next()).done); _iteratorNormalCompletion7 = true) {
            var file = _step7.value;

            var fullPath = _path2['default'].join(this._path, file);

            if (_fs2['default'].statSync(fullPath).isDirectory() && _fs2['default'].existsSync(_path2['default'].join(fullPath, _MicroserviceInstance.Instance.CONFIG_FILE))) {
              this._microservices.push(_MicroserviceInstance.Instance.create(fullPath));
            }
          }
        } catch (err) {
          _didIteratorError7 = true;
          _iteratorError7 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion7 && _iterator7['return']) {
              _iterator7['return']();
            }
          } finally {
            if (_didIteratorError7) {
              throw _iteratorError7;
            }
          }
        }
      }

      return this._microservices;
    }
  }], [{
    key: 'concurrentAsyncCount',
    get: function get() {
      return 3;
    }
  }]);

  return Instance;
})();

exports.Instance = Instance;