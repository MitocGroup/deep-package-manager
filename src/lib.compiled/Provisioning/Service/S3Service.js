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

var _ExceptionFailedToCreateBucketException = require('./Exception/FailedToCreateBucketException');

var _ExceptionFailedAttachingPolicyToBucketException = require('./Exception/FailedAttachingPolicyToBucketException');

var _ExceptionFailedSettingBucketAsWebsiteException = require('./Exception/FailedSettingBucketAsWebsiteException');

var _ExceptionFailedAddingLifecycleException = require('./Exception/FailedAddingLifecycleException');

var _HelpersAwsRequestSyncStack = require('../../Helpers/AwsRequestSyncStack');

var _HelpersHash = require('../../Helpers/Hash');

/**
 * S3 service
 */

var S3Service = (function (_AbstractService) {
  _inherits(S3Service, _AbstractService);

  /**
   * @param {Array} args
   */

  function S3Service() {
    _classCallCheck(this, S3Service);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(S3Service.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(S3Service, [{
    key: 'name',

    /**
     * @returns {String}
     */
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
    }

    /**
     * @returns {string[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {S3Service}
     */
    value: function _setup(services) {
      this._createFsBuckets(S3Service.FS_BUCKETS_SUFFIX)((function (buckets) {
        this._config = {
          buckets: buckets
        };
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {S3Service}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {S3Service}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      this._ready = true;

      return this;
    }

    /**
     * @param {String[]} bucketsSuffix
     * @returns {Function}
     * @private
     */
  }, {
    key: '_createFsBuckets',
    value: function _createFsBuckets(bucketsSuffix) {
      var _this = this;

      var buckets = {};
      var s3 = this.provisioning.s3;
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();
      var tmpBucket = null;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        var _loop = function () {
          var bucketSuffix = _step.value;

          var bucketName = _this.generateAwsResourceName(bucketSuffix, _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE, '', _AbstractService2.AbstractService.DELIMITER_DOT);

          syncStack.push(s3.createBucket({ Bucket: bucketName }), (function (error, data) {
            if (error) {
              throw new _ExceptionFailedToCreateBucketException.FailedToCreateBucketException(bucketName, error);
            }

            var accessPolicy = S3Service.getBucketPolicy(bucketName);
            var params = {
              Bucket: bucketName,
              Policy: accessPolicy.toString()
            };

            buckets[bucketSuffix] = {};

            syncStack.level(1).push(s3.putBucketPolicy(params), (function (error, data) {
              if (error) {
                throw new _ExceptionFailedAttachingPolicyToBucketException.FailedAttachingPolicyToBucketException(bucketName, error);
              }

              buckets[bucketSuffix].name = bucketName;
            }).bind(this));

            // setup public bucket as static website hosting
            if (S3Service.isBucketPublic(bucketName)) {
              var websiteConfig = S3Service.getStaticWebsiteConfig(bucketName);

              syncStack.level(1).push(s3.putBucketWebsite(websiteConfig), (function (error, data) {
                if (error) {
                  throw new _ExceptionFailedSettingBucketAsWebsiteException.FailedSettingBucketAsWebsiteException(bucketName, error);
                }

                // @todo - create website base url from bucketName + region etc
                //buckets[bucketSuffix].website = data;
              }).bind(this));
            } else if (S3Service.isBucketTmp(bucketName)) {
              tmpBucket = bucketName;
            }
          }).bind(_this));
        };

        for (var _iterator = bucketsSuffix[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
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

      return (function (callback) {
        return syncStack.join().ready((function () {
          var lifecyclePayload = {
            Bucket: tmpBucket,
            LifecycleConfiguration: {
              Rules: [{
                Prefix: '',
                Status: 'Enabled',
                Expiration: {
                  Days: S3Service.TMP_DAYS_LIFECYCLE
                }
              }]
            }
          };

          s3.putBucketLifecycle(lifecyclePayload, (function (error, data) {
            if (error) {
              throw new _ExceptionFailedAddingLifecycleException.FailedAddingLifecycleException(tmpBucket, error);
            }

            callback(buckets);
          }).bind(this));
        }).bind(this));
      }).bind(this);
    }

    /**
     * @param {String} bucketName
     * @returns {Core.AWS.IAM.Policy}
     * @private
     */
  }], [{
    key: 'fakeBucketsConfig',

    /**
     * @param {String} propertyIdentifier
     * @returns {Object}
     */
    value: function fakeBucketsConfig(propertyIdentifier) {
      var config = {};
      var propertyHash = _HelpersHash.Hash.md5(propertyIdentifier.toString());

      config[S3Service.TMP_BUCKET] = {
        name: propertyHash + '-' + S3Service.TMP_BUCKET
      };

      config[S3Service.PUBLIC_BUCKET] = {
        name: propertyHash + '-' + S3Service.PUBLIC_BUCKET
      };

      config[S3Service.SYSTEM_BUCKET] = {
        name: propertyHash + '-' + S3Service.SYSTEM_BUCKET
      };

      return config;
    }
  }, {
    key: 'getBucketPolicy',
    value: function getBucketPolicy(bucketName) {
      var policy = new _mitocgroupDeepCore2['default'].AWS.IAM.Policy();

      // allow lambda service to have full access to buckets
      policy.statement.add(S3Service.getCommonPolicyStatement(bucketName));

      // allow everyone to execute s3:GetObject method on public bucket
      if (S3Service.isBucketPublic(bucketName)) {
        policy.statement.add(S3Service.getPublicPolicyStatement(bucketName));
      }

      return policy;
    }

    /**
     * Statement that allows only Lambda service to have full access to passed bucket
     *
     * @param {String} bucketName
     * @returns {Statement}
     * @private
     */
  }, {
    key: 'getCommonPolicyStatement',
    value: function getCommonPolicyStatement(bucketName) {
      var statement = _mitocgroupDeepCore2['default'].AWS.IAM.Factory.create('statement');

      statement.principal = {
        Service: _mitocgroupDeepCore2['default'].AWS.Service.identifier(_mitocgroupDeepCore2['default'].AWS.Service.LAMBDA)
      };

      var action = statement.action.add();
      action.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;

      var resource1 = statement.resource.add();
      resource1.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
      resource1.descriptor = bucketName;

      var resource2 = statement.resource.add();
      resource2.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
      resource2.descriptor = bucketName + '/*';

      return statement;
    }

    /**
     * Statement that allows everyone to execute s3:GetObject method on passed bucket
     *
     * @param {String} bucketName
     * @returns {Statement}
     * @private
     */
  }, {
    key: 'getPublicPolicyStatement',
    value: function getPublicPolicyStatement(bucketName) {
      var statement = _mitocgroupDeepCore2['default'].AWS.IAM.Factory.create('statement');
      statement.principal = '*';

      var action = statement.action.add();
      action.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
      action.action = 'GetObject';

      var resource = statement.resource.add();
      resource.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
      resource.descriptor = bucketName + '/*';

      return statement;
    }

    /**
     * @todo - revise Error / Index docs
     *
     * @param {String} bucketName
     * @returns {Object}
     */
  }, {
    key: 'getStaticWebsiteConfig',
    value: function getStaticWebsiteConfig(bucketName) {
      return {
        Bucket: bucketName,
        WebsiteConfiguration: {
          ErrorDocument: {
            Key: 'errors/4xx.html'
          },
          IndexDocument: {
            Suffix: 'index.html'
          }
        }
      };
    }

    /**
     * @returns {Number}
     */
  }, {
    key: 'isBucketTmp',

    /**
     * @param {String} bucketName
     * @returns {Boolean}
     */
    value: function isBucketTmp(bucketName) {
      return bucketName.indexOf(S3Service.TMP_BUCKET) !== -1;
    }

    /**
     * @param {String} bucketName
     * @returns {Boolean}
     */
  }, {
    key: 'isBucketPublic',
    value: function isBucketPublic(bucketName) {
      return bucketName.indexOf(S3Service.PUBLIC_BUCKET) !== -1;
    }
  }, {
    key: 'TMP_BUCKET',
    get: function get() {
      return 'temp'; // @note - do not change this prefix, it is also used in deep-fs component
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'PUBLIC_BUCKET',
    get: function get() {
      return 'public'; // @note - do not change this prefix, it is also used in deep-fs component
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'SYSTEM_BUCKET',
    get: function get() {
      return 'system'; // @note - do not change this prefix, it is also used in deep-fs component
    }

    /**
     * @returns {String[]}
     */
  }, {
    key: 'FS_BUCKETS_SUFFIX',
    get: function get() {
      return [S3Service.TMP_BUCKET, S3Service.PUBLIC_BUCKET, S3Service.SYSTEM_BUCKET];
    }
  }, {
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.ANY];
    }
  }, {
    key: 'TMP_DAYS_LIFECYCLE',
    get: function get() {
      return 1;
    }
  }]);

  return S3Service;
})(_AbstractService2.AbstractService);

exports.S3Service = S3Service;