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

var _HelpersAwsRequestSyncStack = require('../../Helpers/AwsRequestSyncStack');

var _ExceptionFailedToCreateElasticacheClusterException = require('./Exception/FailedToCreateElasticacheClusterException');

var _HelpersHash = require('../../Helpers/Hash');

/**
 * Elasticache service
 */

var ElasticacheService = (function (_AbstractService) {
  _inherits(ElasticacheService, _AbstractService);

  /**
   * @param {Array} args
   */

  function ElasticacheService() {
    _classCallCheck(this, ElasticacheService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(ElasticacheService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(ElasticacheService, [{
    key: 'name',
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.ELASTIC_CACHE;
    }

    /**
     * @returns {String[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {ElasticacheService}
     */
    value: function _setup(services) {
      //this._createCluster(
      //    this.awsAccountId,
      //    this.propertyIdentifier
      //)(function(dsn) {
      //    this._config = {
      //        dsn: dsn
      //    };
      //
      //    this._ready = true;
      //}.bind(this));

      this._ready = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {ElasticacheService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {ElasticacheService}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      this._ready = true;

      return this;
    }

    /**
     * @param {String} awsAccountId
     * @param {String} propertyIdentifier
     * @returns {Function}
     * @private
     */
  }, {
    key: '_createCluster',
    value: function _createCluster(awsAccountId, propertyIdentifier) {
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();
      var ec = this.provisioning.elasticCache;

      var clusterId = ElasticacheService._buildClusterId(awsAccountId, propertyIdentifier);

      var parameters = {
        CacheClusterId: clusterId,

        //PreferredAvailabilityZone: ec.config.region, // @todo: figure out availability zones...
        Engine: ElasticacheService.ENGINE,
        CacheNodeType: ElasticacheService.INSTANCE,
        NumCacheNodes: 1
      };

      syncStack.push(ec.createCacheCluster(parameters), (function (error, data) {
        if (error) {
          throw new _ExceptionFailedToCreateElasticacheClusterException.FailedToCreateElasticacheClusterException(clusterId, error);
        }
      }).bind(this));

      return (function (callback) {
        return syncStack.join().ready((function () {
          this._acquireEndpoint(clusterId, callback);
        }).bind(this));
      }).bind(this);
    }

    /**
     * @param {String} clusterId
     * @param {Function} callback
     * @private
     */
  }, {
    key: '_acquireEndpoint',
    value: function _acquireEndpoint(clusterId, callback) {
      var dsn = '';
      var succeed = false;
      var ec = this.provisioning.elasticCache;
      var innerSyncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      var describeParameters = {
        CacheClusterId: clusterId,
        ShowCacheNodeInfo: true
      };

      innerSyncStack.push(ec.describeCacheClusters(describeParameters), (function (error, data) {
        if (error) {
          throw new _ExceptionFailedToCreateElasticacheClusterException.FailedToCreateElasticacheClusterException(clusterId, error);
        }

        var nodes = data.CacheClusters[0].CacheNodes;

        if (nodes.length > 0) {
          var endpoint = nodes[0].Endpoint;
          dsn = 'redis://' + endpoint.Address + ':' + endpoint.Port;
          succeed = true;
        }
      }).bind(this));

      innerSyncStack.join().ready((function () {
        if (succeed) {
          callback(dsn);
        } else {
          setTimeout((function () {
            this._acquireEndpoint(clusterId, callback);
          }).bind(this), ElasticacheService.WAIT_TIME);
        }
      }).bind(this));
    }

    /**
     * @returns {Number}
     */
  }], [{
    key: '_buildClusterId',

    /**
     * @param {String} awsAccountId
     * @param {String} propertyIdentifier
     * @private
     *
     * @todo: figure out why we are limited to 20 chars
     */
    value: function _buildClusterId(awsAccountId, propertyIdentifier) {
      var accountHash = _HelpersHash.Hash.crc32(awsAccountId.toString());
      var propertyHash = _HelpersHash.Hash.crc32(propertyIdentifier.toString());
      var propertyParts = propertyIdentifier.toString().replace(/[^a-zA-Z0-9-]+/, '').split('');
      var propertySuffix = '' + propertyParts.shift() + propertyParts.pop();

      return 'd' + accountHash + '-' + propertyHash + propertySuffix;
    }
  }, {
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.all()];
    }
  }, {
    key: 'WAIT_TIME',
    get: function get() {
      return 2000;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'INSTANCE',
    get: function get() {
      return 'cache.t2.micro';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'ENGINE',
    get: function get() {
      return 'redis';
    }
  }]);

  return ElasticacheService;
})(_AbstractService2.AbstractService);

exports.ElasticacheService = ElasticacheService;