/**
 * Created by AlexanderC on 6/4/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _syncExec = require('sync-exec');

var _syncExec2 = _interopRequireDefault(_syncExec);

var _HelpersFileWalker = require('../Helpers/FileWalker');

var _ExceptionInvalidArgumentException = require('../Exception/InvalidArgumentException');

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _ExceptionMissingRootIndexException = require('./Exception/MissingRootIndexException');

var _ExceptionFailedUploadingFileToS3Exception = require('./Exception/FailedUploadingFileToS3Exception');

var _HelpersAwsRequestSyncStack = require('../Helpers/AwsRequestSyncStack');

var _MicroserviceMetadataAction = require('../Microservice/Metadata/Action');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

/**
 * Frontend
 */

var Frontend = (function () {
  /**
   * @param {Object} microservicesConfig
   * @param {String} basePath
   */

  function Frontend(microservicesConfig, basePath) {
    _classCallCheck(this, Frontend);

    this._microservicesConfig = microservicesConfig;
    this._basePath = _underscoreString2['default'].rtrim(basePath, '/');
  }

  /**
   * @param {Object} propertyConfig
   * @return {Object}
   */

  _createClass(Frontend, [{
    key: 'deploy',

    /**
     * @param AWS
     * @param bucketName
     * @returns {WaitFor}
     */
    value: function deploy(AWS, bucketName) {
      //let s3 = new AWS.S3();

      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      //let walker = new FileWalker(FileWalker.RECURSIVE);
      //let sliceOffset = this.path.length + 1; // used to remove base path from file name

      // @todo: remove this hook when fixing s3 sync functionality
      var credentialsFile = _tmp2['default'].tmpNameSync();

      var credentials = '[profile deep]' + _os2['default'].EOL;
      credentials += 'aws_access_key_id=' + AWS.config.credentials.accessKeyId + _os2['default'].EOL;
      credentials += 'aws_secret_access_key=' + AWS.config.credentials.secretAccessKey + _os2['default'].EOL;
      credentials += 'region=' + AWS.config.region + _os2['default'].EOL;

      console.log('- dump AWS tmp credentials into ' + credentialsFile);

      _fs2['default'].writeFileSync(credentialsFile, credentials);

      var syncCommand = 'export AWS_CONFIG_FILE=' + credentialsFile + '; ';
      syncCommand += 'aws s3 sync --profile deep --storage-class REDUCED_REDUNDANCY \'' + this.path + '\' \'s3://' + bucketName + '\'';

      console.log('- running tmp hook ' + syncCommand);

      var syncResult = (0, _syncExec2['default'])(syncCommand);

      if (syncResult.status !== 0) {
        throw new _ExceptionFailedUploadingFileToS3Exception.FailedUploadingFileToS3Exception('*', bucketName, syncResult.stderr);
      }

      // @todo: improve this by using directory upload
      //for (let file of walker.walk(this.path, FileWalker.skipDotsFilter())) {
      //    let params = {
      //        Bucket: bucketName,
      //        Key: file.slice(sliceOffset),
      //        Body: FileSystem.readFileSync(file),
      //        ContentType: Mime.lookup(file)
      //    };
      //
      //    syncStack.push(s3.putObject(params), function(error, data) {
      //        if (error) {
      //            throw new FailedUploadingFileToS3Exception(file, bucketName, error);
      //        }
      //    }.bind(this));
      //}

      return syncStack.join();
    }

    /**
     * @param {Object} propertyConfig
     */
  }, {
    key: 'build',
    value: function build(propertyConfig) {
      if (!(propertyConfig instanceof Object)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(propertyConfig, 'Object');
      }

      var basePath = this.path;

      _fs2['default'].mkdirSync(basePath);
      _jsonfile2['default'].writeFileSync(this.configPath, propertyConfig);

      for (var identifier in this._microservicesConfig) {
        if (!this._microservicesConfig.hasOwnProperty(identifier)) {
          continue;
        }

        var config = this._microservicesConfig[identifier];
        var modulePath = this.modulePath(identifier);
        var frontendPath = config.autoload.frontend;

        _fs2['default'].mkdirSync(modulePath);

        var walker = new _HelpersFileWalker.FileWalker(_HelpersFileWalker.FileWalker.RECURSIVE, '.deepignore');

        // @todo: implement this in a smarter way
        if (config.isRoot) {
          var indexFile = frontendPath + '/index.html';
          var indexStats = _fs2['default'].lstatSync(indexFile);

          if (!indexStats.isFile()) {
            throw new _ExceptionMissingRootIndexException.MissingRootIndexException(identifier);
          }

          // The root micro-service frontend files are moved into property document ro
          walker.copy(frontendPath, this.path);

          _fs2['default'].rmdirSync(modulePath);
        } else {
          // All non root micro-service frontend files are namespaced by microservice identifier
          walker.copy(frontendPath, modulePath);
        }
      }
    }

    /**
     * @param {String} moduleIdentifier
     * @returns {String}
     */
  }, {
    key: 'modulePath',
    value: function modulePath(moduleIdentifier) {
      var base = this.path;

      return base + '/' + moduleIdentifier;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'basePath',

    /**
     * @returns {String}
     */
    get: function get() {
      return this._basePath;
    }
  }, {
    key: 'configPath',
    get: function get() {
      var base = this.path;

      return base + '/_config.json';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'path',
    get: function get() {
      var base = this._basePath;

      return base + '/_public';
    }
  }], [{
    key: 'createConfig',
    value: function createConfig(propertyConfig) {
      var config = {
        env: propertyConfig.env,
        deployId: propertyConfig.deployId,
        awsRegion: propertyConfig.awsRegion,
        models: propertyConfig.models,
        identityPoolId: '',
        identityProviders: '',
        microservices: {},
        globals: propertyConfig.globals
      };

      if (propertyConfig.provisioning) {
        var cognitoConfig = propertyConfig.provisioning[_mitocgroupDeepCore2['default'].AWS.Service.COGNITO_IDENTITY];

        config.identityPoolId = cognitoConfig.identityPool.IdentityPoolId;
        config.identityProviders = cognitoConfig.identityPool.SupportedLoginProviders;
      }

      for (var microserviceIdentifier in propertyConfig.microservices) {
        if (!propertyConfig.microservices.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microservice = propertyConfig.microservices[microserviceIdentifier];
        var microserviceConfig = {
          isRoot: microservice.isRoot,
          parameters: microservice.parameters.frontend,
          resources: {}
        };

        for (var resourceName in microservice.resources) {
          if (!microservice.resources.hasOwnProperty(resourceName)) {
            continue;
          }

          microserviceConfig.resources[resourceName] = {};

          var resourceActions = microservice.resources[resourceName];

          for (var actionName in resourceActions) {
            if (!resourceActions.hasOwnProperty(actionName)) {
              continue;
            }

            var action = resourceActions[actionName];

            microserviceConfig.resources[resourceName][action.name] = {
              type: action.type,
              methods: action.methods,
              source: action.source
            };

            if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
              var lambdaConfig = microservice.lambdas[action.identifier];
              microserviceConfig.resources[resourceName][action.name].source = lambdaConfig.name;
              microserviceConfig.resources[resourceName][action.name].region = lambdaConfig.region;
            }
          }
        }

        config.microservices[microserviceIdentifier] = microserviceConfig;
      }

      return config;
    }
  }]);

  return Frontend;
})();

exports.Frontend = Frontend;