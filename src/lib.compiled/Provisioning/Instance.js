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

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _ExceptionInvalidArgumentException = require('../Exception/InvalidArgumentException');

var _ServiceS3Service = require('./Service/S3Service');

var _ServiceCognitoIdentityService = require('./Service/CognitoIdentityService');

var _ServiceIAMService = require('./Service/IAMService');

var _ServiceCloudFrontService = require('./Service/CloudFrontService');

var _ServiceSNSService = require('./Service/SNSService');

var _ServiceLambdaService = require('./Service/LambdaService');

var _ServiceKinesisService = require('./Service/KinesisService');

var _ServiceDynamoDBService = require('./Service/DynamoDBService');

var _ServiceElasticacheService = require('./Service/ElasticacheService');

var _ServiceAPIGatewayService = require('./Service/APIGatewayService');

var _PropertyInstance = require('../Property/Instance');

var _HelpersWaitFor = require('../Helpers/WaitFor');

var _amazonApiGatewayClient = require('amazon-api-gateway-client');

/**
 * Provisioning instance
 */

var Instance = (function () {
  /**
   * @param {PropertyInstance} property
   */

  function Instance(property) {
    _classCallCheck(this, Instance);

    if (!(property instanceof _PropertyInstance.Instance)) {
      throw new _ExceptionInvalidArgumentException.InvalidArgumentException(property, _PropertyInstance.Instance);
    }

    this._property = property;

    this._s3 = new property.AWS.S3();
    this._dynamoDb = new property.AWS.DynamoDB();
    this._elasticache = new property.AWS.ElastiCache();
    this._sns = new property.AWS.SNS();
    this._cloudFront = new property.AWS.CloudFront();
    this._iam = new property.AWS.IAM();

    // set appropriate region for services that are not available on all regions
    this._kinesis = new property.AWS.Kinesis({
      region: this.getAwsServiceRegion(_ServiceKinesisService.KinesisService, property.config.awsRegion)
    });
    this._lambda = new property.AWS.Lambda({
      region: this.getAwsServiceRegion(_ServiceLambdaService.LambdaService, property.config.awsRegion)
    });
    this._cognitoIdentity = new property.AWS.CognitoIdentity({
      region: this.getAwsServiceRegion(_ServiceCognitoIdentityService.CognitoIdentityService, property.config.awsRegion)
    });

    // @todo - replace this client with AWS native one than it'll be available
    this._apiGateway = new _amazonApiGatewayClient.Client({
      accessKeyId: property.AWS.config.credentials.accessKeyId,
      secretAccessKey: property.AWS.config.credentials.secretAccessKey,
      region: this.getAwsServiceRegion(_ServiceCognitoIdentityService.CognitoIdentityService, property.config.awsRegion)
    });

    this._config = {};

    this._services = null;
  }

  /**
   * @param {Function} awsService
   * @param {string} defaultRegion
   * @returns {string}
   */

  _createClass(Instance, [{
    key: 'getAwsServiceRegion',
    value: function getAwsServiceRegion(awsService, defaultRegion) {
      return _mitocgroupDeepCore2['default'].AWS.Region.getAppropriateAwsRegion(defaultRegion, awsService.AVAILABLE_REGIONS);
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'create',

    /**
     * @param {Function} callback
     */
    value: function create(callback) {
      var _this = this;

      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      var services = this.services;
      var wait = new _HelpersWaitFor.WaitFor();
      var remaining = services.iterator.length;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function () {
          var service = _step.value;

          service.setup(services).ready((function () {
            this._config[service.name()] = service.config();
            remaining--;
          }).bind(_this));
        };

        for (var _iterator = services.iterator[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          _loop();
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

      wait.push((function () {
        return remaining <= 0;
      }).bind(this));

      wait.ready((function () {
        var subWait = new _HelpersWaitFor.WaitFor();

        var subRemaining = services.iterator.length;

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = services.iterator[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var service = _step2.value;

            service.postProvision(services).ready((function () {
              // @todo: why is this resetting the object?
              //this._config[service.name()] = service.config();
              subRemaining--;
            }).bind(this));
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

        subWait.ready((function () {
          callback(this._config);
        }).bind(this));
      }).bind(this));
    }

    /**
     * @param {Function} callback
     */
  }, {
    key: 'postDeployProvision',
    value: function postDeployProvision(callback) {
      var _this2 = this;

      if (!(callback instanceof Function)) {
        throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
      }

      var services = this.services;
      var wait = new _HelpersWaitFor.WaitFor();
      var remaining = services.iterator.length;

      var _iteratorNormalCompletion3 = true;
      var _didIteratorError3 = false;
      var _iteratorError3 = undefined;

      try {
        var _loop2 = function () {
          var service = _step3.value;

          service.postDeployProvision(services).ready((function () {
            this._config[service.name()] = service.config();
            remaining--;
          }).bind(_this2));
        };

        for (var _iterator3 = services.iterator[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
          _loop2();
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

      wait.push((function () {
        return remaining <= 0;
      }).bind(this));

      wait.ready((function () {
        callback(this._config);
      }).bind(this));
    }
  }, {
    key: 'config',
    get: function get() {
      return this._config;
    }

    /**
     * @returns {PropertyInstance}
     */
  }, {
    key: 'property',
    get: function get() {
      return this._property;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 's3',
    get: function get() {
      return this._s3;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'dynamoDB',
    get: function get() {
      return this._dynamoDb;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'elasticCache',
    get: function get() {
      return this._elasticache;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'kinesis',
    get: function get() {
      return this._kinesis;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'sns',
    get: function get() {
      return this._sns;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'lambda',
    get: function get() {
      return this._lambda;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'iam',
    get: function get() {
      return this._iam;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'cognitoIdentity',
    get: function get() {
      return this._cognitoIdentity;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'cloudFront',
    get: function get() {
      return this._cloudFront;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'apiGateway',
    get: function get() {
      return this._apiGateway;
    }

    /**
     * @returns {Core.Generic.ObjectStorage}
     */
  }, {
    key: 'services',
    get: function get() {
      if (this._services === null) {
        // @todo - add only required services that are configured in appConfig file
        this._services = new _mitocgroupDeepCore2['default'].Generic.ObjectStorage([new _ServiceS3Service.S3Service(this), new _ServiceElasticacheService.ElasticacheService(this), new _ServiceDynamoDBService.DynamoDBService(this), new _ServiceKinesisService.KinesisService(this), new _ServiceSNSService.SNSService(this), new _ServiceIAMService.IAMService(this), new _ServiceCognitoIdentityService.CognitoIdentityService(this), new _ServiceCloudFrontService.CloudFrontService(this), new _ServiceLambdaService.LambdaService(this)]);
      }

      // @todo - activate it when implementation is done
      // new APIGatewayService(this),
      return this._services;
    }
  }]);

  return Instance;
})();

exports.Instance = Instance;