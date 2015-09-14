/**
 * Created by AlexanderC on 6/2/15.
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

var _archiver = require('archiver');

var _archiver2 = _interopRequireDefault(_archiver);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ExceptionFailedLambdaUploadException = require('./Exception/FailedLambdaUploadException');

var _ExceptionFailedUploadingLambdaToS3Exception = require('./Exception/FailedUploadingLambdaToS3Exception');

var _HelpersAwsRequestSyncStack = require('../Helpers/AwsRequestSyncStack');

var _HelpersWaitFor = require('../Helpers/WaitFor');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _Frontend = require('./Frontend');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _ProvisioningServiceS3Service = require('../Provisioning/Service/S3Service');

var _mime = require('mime');

var _mime2 = _interopRequireDefault(_mime);

var _fsExtra = require('fs-extra');

var _fsExtra2 = _interopRequireDefault(_fsExtra);

var _ExceptionInvalidConfigException = require('./Exception/InvalidConfigException');

var _ExceptionException = require('../Exception/Exception');

/**
 * Lambda instance
 */

var Lambda = (function () {
  /**
   * @param {Property} property
   * @param {String} microserviceIdentifier
   * @param {String} identifier
   * @param {String} name
   * @param {Object} execRole
   * @param {String} path
   */

  function Lambda(property, microserviceIdentifier, identifier, name, execRole, path) {
    _classCallCheck(this, Lambda);

    this._property = property;
    this._microserviceIdentifier = microserviceIdentifier;
    this._identifier = identifier;
    this._name = name;
    this._execRole = execRole;
    this._path = _underscoreString2['default'].rtrim(path, '/');
    this._outputPath = _underscoreString2['default'].rtrim(property.path, '/');
    this._zipPath = this._outputPath + '/' + microserviceIdentifier + '_lambda_' + identifier + '.zip';

    this._memorySize = Lambda.DEFAULT_MEMORY_LIMIT;
    this._timeout = Lambda.DEFAULT_TIMEOUT;

    this._uploadedLambda = null;
  }

  /**
   * @param {Object} propertyConfig
   * @return {Object}
   */

  _createClass(Lambda, [{
    key: 'createConfig',
    value: function createConfig(propertyConfig) {
      var config = _Frontend.Frontend.createConfig(propertyConfig);

      config.microserviceIdentifier = this.microserviceIdentifier;
      config.awsAccountId = propertyConfig.awsAccountId;
      config.propertyIdentifier = propertyConfig.propertyIdentifier;
      config.timestamp = new Date().getTime();
      config.buckets = _ProvisioningServiceS3Service.S3Service.fakeBucketsConfig(propertyConfig.propertyIdentifier);
      config.tablesNames = [];

      //config.cacheDsn = '';

      if (propertyConfig.provisioning) {
        config.buckets = propertyConfig.provisioning[_mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE].buckets;
        config.tablesNames = propertyConfig.provisioning[_mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB].tablesNames;

        //config.cacheDsn = propertyConfig.provisioning[Core.AWS.Service.ELASTIC_CACHE].dsn;
      }

      for (var microserviceIdentifier in propertyConfig.microservices) {
        if (!propertyConfig.microservices.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microservice = propertyConfig.microservices[microserviceIdentifier];

        config.microservices[microserviceIdentifier].parameters = microservice.parameters.backend;
      }

      return config;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'update',

    /**
     * @param {Function} callback
     * @returns {Lambda}
     */
    value: function update(callback) {
      this.pack().ready((function () {
        this.updateCode().ready(callback);
      }).bind(this));

      return this;
    }

    /**
     * @param {Function} callback
     * @returns {Lambda}
     */
  }, {
    key: 'deploy',
    value: function deploy(callback) {
      this.pack().ready((function () {
        console.log('- Lambda ' + this._identifier + ' packing is ready!: ' + new Date().toTimeString());

        this.upload().ready(callback);
      }).bind(this));

      return this;
    }

    /**
     * @param {String} path
     * @param {String} outputFile
     * @returns {WaitFor}
     */
  }, {
    key: 'pack',

    /**
     * @returns {WaitFor}
     */
    value: function pack() {
      console.log('- Start packing lambda ' + this._identifier + '!: ' + new Date().toTimeString());

      this.persistConfig();

      var buildFile = this._path + '.zip';

      if (_fs2['default'].existsSync(buildFile)) {
        console.log('- Lambda prebuilt in ' + buildFile);

        _fsExtra2['default'].copySync(buildFile, this._zipPath);

        return Lambda.injectPackageConfig(this._path, this._zipPath);
      } else {
        return Lambda.createPackage(this._path, this._zipPath);
      }
    }

    /**
     * @returns {AwsRequestSyncStack}
     */
  }, {
    key: 'updateCode',
    value: function updateCode() {
      return this.upload(true);
    }

    /**
     * @param {Boolean} update
     * @returns {AwsRequestSyncStack}
     */
  }, {
    key: 'upload',
    value: function upload() {
      var update = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

      console.log('- Start uploading lambda ' + this._identifier + '!: ' + new Date().toTimeString());

      var lambda = this._property.provisioning.lambda;
      var s3 = this._property.provisioning.s3;
      var tmpBucket = this._property.config.provisioning.s3.buckets[_ProvisioningServiceS3Service.S3Service.TMP_BUCKET].name;

      var objectKey = this._zipPath.split('/').pop();

      var s3Params = {
        Bucket: tmpBucket,
        Key: objectKey,
        Body: _fs2['default'].readFileSync(this._zipPath),
        ContentType: _mime2['default'].lookup(this._zipPath)
      };

      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      syncStack.push(s3.putObject(s3Params), (function (error, data) {
        if (error) {
          throw new _ExceptionFailedUploadingLambdaToS3Exception.FailedUploadingLambdaToS3Exception(objectKey, tmpBucket, error);
        }

        var request = null;

        console.log('- Lambda ' + this._identifier + ' uploaded!: ' + new Date().toTimeString());

        if (update) {
          var params = {
            S3Bucket: tmpBucket,
            S3Key: objectKey,
            S3ObjectVersion: data.VersionId,
            FunctionName: this.functionName
          };

          request = lambda.updateFunctionCode(params);
        } else {
          var params = {
            Code: {
              S3Bucket: tmpBucket,
              S3Key: objectKey,
              S3ObjectVersion: data.VersionId
            },
            FunctionName: this.functionName,
            Handler: Lambda.HANDLER,
            Role: this._execRole.Arn,
            Runtime: Lambda.RUNTIME,
            MemorySize: this._memorySize,
            Timeout: this._timeout
          };

          request = lambda.createFunction(params);
        }

        syncStack.level(1).push(request, (function (error, data) {
          if (error) {
            // @todo: remove this hook
            if (Lambda.isErrorFalsePositive(error)) {
              // @todo: get rid of this hook...
              this._uploadedLambda = this.createConfigHookData;

              return;
            }

            throw new _ExceptionFailedLambdaUploadException.FailedLambdaUploadException(this, error);
          }

          this._uploadedLambda = data;
        }).bind(this));
      }).bind(this));

      return syncStack.join();
    }

    /**
     * @todo: remove this after fixing AWS issue [see this.isErrorFalsePositive()]
     *
     * @returns {Object}
     */
  }, {
    key: 'persistConfig',

    /**
     * @returns {Lambda}
     */
    value: function persistConfig() {
      _jsonfile2['default'].writeFileSync(this.path + '/_config.json', this.createConfig(this._property.config));

      return this;
    }

    /**
     * @returns {Number}
     */
  }, {
    key: 'microserviceIdentifier',
    get: function get() {
      return this._microserviceIdentifier;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'awsAccountId',
    get: function get() {
      return this._property.config.awsAccountId;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'propertyIdentifier',
    get: function get() {
      return this._property.identifier;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'region',
    get: function get() {
      return this._property.provisioning.lambda.config.region;
    }

    /**
     * @returns {Number}
     */
  }, {
    key: 'timeout',
    get: function get() {
      return this._timeout;
    },

    /**
     * @param {Number} timeout
     */
    set: function set(timeout) {
      this._timeout = timeout;
    }

    /**
     * @returns {Number}
     */
  }, {
    key: 'memorySize',
    get: function get() {
      return this._memorySize;
    },

    /**
     * @param {Number} memorySize
     */
    set: function set(memorySize) {
      this._memorySize = memorySize;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'identifier',
    get: function get() {
      return this._identifier;
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
    key: 'outputPath',
    get: function get() {
      return this._outputPath;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'zipPath',
    get: function get() {
      return this._zipPath;
    }

    /**
     * @returns {null|Object}
     */
  }, {
    key: 'uploadedLambda',
    get: function get() {
      return this._uploadedLambda;
    }
  }, {
    key: 'createConfigHookData',
    get: function get() {
      return {
        CodeSize: 0,
        Description: '',
        FunctionArn: 'arn:aws:lambda:' + this.region + ':' + this.awsAccountId + ':function:' + this.functionName,
        FunctionName: this.functionName,
        Handler: Lambda.HANDLER,
        LastModified: new Date().toISOString(),
        MemorySize: Lambda.DEFAULT_MEMORY_LIMIT,
        Role: this._execRole.Arn,
        Runtime: Lambda.RUNTIME,
        Timeout: Lambda.DEFAULT_TIMEOUT
      };
    }

    /**
     * @todo: temporary fix of the unexpected result (sorry for this guys :/)
     *
     * @param {Object} error
     * @returns {Boolean}
     */
  }, {
    key: 'functionName',

    /**
     * @returns {String}
     */
    get: function get() {
      return this._name;
    }
  }], [{
    key: 'createPackage',
    value: function createPackage(path) {
      var outputFile = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      outputFile = outputFile || path + '.zip';

      var wait = new _HelpersWaitFor.WaitFor();
      var ready = false;
      var output = _fs2['default'].createWriteStream(outputFile);
      var archive = (0, _archiver2['default'])('zip');

      output.on('close', (function () {
        ready = true;
      }).bind(this));

      wait.push((function () {
        return ready;
      }).bind(this));

      archive.pipe(output);

      archive.directory(path, false).finalize();

      return wait;
    }

    /**
     * @param {String} lambdaPath
     * @param {String} packageFile
     * @returns {WaitFor}
     */
  }, {
    key: 'injectPackageConfig',
    value: function injectPackageConfig(lambdaPath, packageFile) {
      var wait = new _HelpersWaitFor.WaitFor();
      var ready = false;

      var configFile = _path2['default'].join(lambdaPath, Lambda.CONFIG_FILE);

      if (!_fs2['default'].existsSync(packageFile)) {
        throw new _ExceptionInvalidConfigException.InvalidConfigException('Package file not found in ' + packageFile + '!');
      }

      if (!_fs2['default'].existsSync(configFile)) {
        throw new _ExceptionInvalidConfigException.InvalidConfigException('Config file not found in ' + configFile + '!');
      }

      // @todo: remove this temporary hook by rewriting it in a native way
      require('child_process').exec('cd ' + _path2['default'].dirname(configFile) + ' && zip -r ' + packageFile + ' ' + Lambda.CONFIG_FILE, (function (error, stdout, stderr) {
        if (error !== null) {
          throw new _ExceptionException.Exception('Error while adding ' + Lambda.CONFIG_FILE + ' to lambda build: ' + error);
        }

        ready = true;
      }).bind(this));

      wait.push((function () {
        return ready;
      }).bind(this));

      return wait;
    }
  }, {
    key: 'isErrorFalsePositive',
    value: function isErrorFalsePositive(error) {
      return (error.code === 'ResourceConflictException' || error.code === 'EntityAlreadyExists') && error.statusCode === 409;
    }
  }, {
    key: 'DEFAULT_TIMEOUT',
    get: function get() {
      return 60;
    }

    /**
     * @returns {Number}
     */
  }, {
    key: 'DEFAULT_MEMORY_LIMIT',
    get: function get() {
      return 128;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'HANDLER',
    get: function get() {
      return 'bootstrap.handler';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'RUNTIME',
    get: function get() {
      return 'nodejs';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'CONFIG_FILE',
    get: function get() {
      return '_config.json';
    }
  }]);

  return Lambda;
})();

exports.Lambda = Lambda;