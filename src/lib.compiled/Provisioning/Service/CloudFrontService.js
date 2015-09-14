/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _AbstractService2 = require('./AbstractService');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _S3Service = require('./S3Service');

var _HelpersHash = require('../../Helpers/Hash');

var _ExceptionFailedToCreateCloudFrontDistributionException = require('./Exception/FailedToCreateCloudFrontDistributionException');

/**
 * CloudFront service
 */

var CloudFrontService = (function (_AbstractService) {
  _inherits(CloudFrontService, _AbstractService);

  /**
   * @param {Array} args
   */

  function CloudFrontService() {
    _classCallCheck(this, CloudFrontService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(CloudFrontService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(CloudFrontService, [{
    key: 'name',
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.CLOUD_FRONT;
    }

    /**
     * @returns {String[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CloudFrontService}
     */
    value: function _setup(services) {
      this._config = {};

      this._ready = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CloudFrontService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._createDistribution(services, (function (cfData) {
        this._config.id = cfData.Distribution.Id;
        this._config.domain = cfData.Distribution.DomainName;

        this._readyTeardown = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CloudFrontService}
     */
  }, {
    key: '_createDistribution',
    value: function _createDistribution(services, cb) {
      var cf = this.provisioning.cloudFront;

      var idPrefix = this.awsAccountId + '-' + this.env + '-';

      var bucketName = services.find(_S3Service.S3Service).config().buckets[_S3Service.S3Service.PUBLIC_BUCKET].name;
      var environmentPath = '' + idPrefix + _HelpersHash.Hash.crc32(this.propertyIdentifier) + _HelpersHash.Hash.crc32(bucketName);
      var originId = bucketName + '.s3.amazonaws.com';

      var payload = {
        DistributionConfig: {
          CallerReference: environmentPath,
          Comment: environmentPath,
          DefaultCacheBehavior: {
            ForwardedValues: {
              Cookies: {
                Forward: 'all'
              },
              QueryString: true
            },
            MinTTL: 0,
            MaxTTL: 31536000,
            DefaultTTL: 86400,
            TargetOriginId: originId,
            TrustedSigners: {
              Enabled: false,
              Quantity: 0
            },
            ViewerProtocolPolicy: 'allow-all'
          },
          Enabled: true,
          Origins: {
            Quantity: 1,
            Items: [{
              Id: originId,
              DomainName: originId,
              OriginPath: '',
              S3OriginConfig: {
                OriginAccessIdentity: ''
              }
            }]
          },
          DefaultRootObject: 'index.html',
          ViewerCertificate: {
            CloudFrontDefaultCertificate: true,
            MinimumProtocolVersion: 'SSLv3'
          },
          CustomErrorResponses: {
            Items: [{
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 300
            }],
            Quantity: 1
          }
        }
      };

      cf.createDistribution(payload, (function (error, data) {
        if (error) {
          throw new _ExceptionFailedToCreateCloudFrontDistributionException.FailedToCreateCloudFrontDistributionException(error);
        }

        cb(data);
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CloudFrontService}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      this._ready = true;

      return this;
    }
  }], [{
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.ANY];
    }
  }]);

  return CloudFrontService;
})(_AbstractService2.AbstractService);

exports.CloudFrontService = CloudFrontService;