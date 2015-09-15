/**
 * Created by mgoria on 9/11/15.
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

var _HelpersWaitFor = require('../../Helpers/WaitFor');

var _ExceptionFailedToCreateApiGatewayException = require('./Exception/FailedToCreateApiGatewayException');

var _ExceptionFailedToCreateApiResourcesException = require('./Exception/FailedToCreateApiResourcesException');

/**
 * APIGateway service
 */

var APIGatewayService = (function (_AbstractService) {
  _inherits(APIGatewayService, _AbstractService);

  /**
   * @param {Array} args
   */

  function APIGatewayService() {
    _classCallCheck(this, APIGatewayService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(APIGatewayService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(APIGatewayService, [{
    key: 'name',
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.API_GATEWAY;
    }

    /**
     * API default metadata
     *
     * @returns {Object}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {APIGatewayService}
     */
    value: function _setup(services) {
      this._createApiResources(this.apiMetadata, this._getResourcePaths(this.provisioning.property.microservices))((function (api, resources) {
        this._config.api = {
          id: api.id,
          name: api.name,
          resources: resources
        };
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {APIGatewayService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {APIGatewayService}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      this._ready = true;

      return this;
    }

    /**
     * @param {Object} metadata
     * @param {Array} resourcePaths
     * @returns {function}
     * @private
     */
  }, {
    key: '_createApiResources',
    value: function _createApiResources(metadata, resourcePaths) {
      var _this = this;

      var restApi = null;
      var restResources = null;
      var apiGateway = this.provisioning.apiGateway;
      var wait = new _HelpersWaitFor.WaitFor();

      console.log('resourcePaths - ', resourcePaths);

      apiGateway.createRestapi(metadata).then(function (api) {
        restApi = api.source;
      }, function (error) {

        if (error) {
          throw new _ExceptionFailedToCreateApiGatewayException.FailedToCreateApiGatewayException(metadata.name, error);
        }
      });

      wait.push(function () {
        return restApi !== null;
      });

      return function (callback) {
        return wait.ready(function () {
          var innerWait = new _HelpersWaitFor.WaitFor();

          var params = {
            paths: resourcePaths,
            restapiId: restApi.id
          };

          apiGateway.createResources(params).then(function (resources) {
            restResources = resources;
          }, function (error) {

            if (error) {
              throw new _ExceptionFailedToCreateApiResourcesException.FailedToCreateApiResourcesException(paths, error);
            }
          });

          innerWait.push((function () {
            return restResources !== null;
          }).bind(_this));

          return innerWait.ready(function () {
            callback(restApi, restResources);
          });
        });
      };
    }

    /**
     * @param {Object} microservices
     * @returns {Array}
     * @private
     */
  }, {
    key: '_getResourcePaths',
    value: function _getResourcePaths(microservices) {
      var resourcePaths = [];

      for (var microserviceKey in microservices) {
        if (!microservices.hasOwnProperty(microserviceKey)) {
          continue;
        }

        var microservice = microservices[microserviceKey];

        resourcePaths.push('/' + microservice.identifier);

        for (var actionKey in microservice.resources.actions) {
          if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
            continue;
          }

          var action = microservice.resources.actions[actionKey];
          var resourcePath = '/' + microservice.identifier + '/' + action.resourceName;

          // push actions parent resource only once
          if (resourcePaths.indexOf(resourcePath) === -1) {
            resourcePaths.push(resourcePath);
          }

          resourcePaths.push('/' + microservice.identifier + '/' + action.resourceName + '/' + action.name);
        }
      }

      return resourcePaths;
    }
  }, {
    key: 'apiMetadata',
    get: function get() {
      return {
        name: this.generateAwsResourceName('Api', _mitocgroupDeepCore2['default'].AWS.Service.API_GATEWAY)
      };
    }

    /**
     * @returns {String[]}
     */
  }], [{
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.US_EAST_N_VIRGINIA, _mitocgroupDeepCore2['default'].AWS.Region.US_WEST_OREGON, _mitocgroupDeepCore2['default'].AWS.Region.EU_IRELAND];
    }
  }]);

  return APIGatewayService;
})(_AbstractService2.AbstractService);

exports.APIGatewayService = APIGatewayService;