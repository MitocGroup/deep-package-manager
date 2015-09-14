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

var _ExceptionFailedToCreateIdentityPoolException = require('./Exception/FailedToCreateIdentityPoolException');

var _HelpersAwsRequestSyncStack = require('../../Helpers/AwsRequestSyncStack');

var _ExceptionFailedToCreateIamRoleException = require('./Exception/FailedToCreateIamRoleException');

var _ExceptionFailedSettingIdentityPoolRolesException = require('./Exception/FailedSettingIdentityPoolRolesException');

var _ExceptionFailedAttachingPolicyToRoleException = require('./Exception/FailedAttachingPolicyToRoleException');

var _ExceptionException = require('../../Exception/Exception');

var _MicroserviceMetadataAction = require('../../Microservice/Metadata/Action');

/**
 * Cognito service
 */

var CognitoIdentityService = (function (_AbstractService) {
  _inherits(CognitoIdentityService, _AbstractService);

  /**
   * @param {Array} args
   */

  function CognitoIdentityService() {
    _classCallCheck(this, CognitoIdentityService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(CognitoIdentityService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {string}
   */

  _createClass(CognitoIdentityService, [{
    key: 'name',

    /**
     * @returns {String}
     */
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.COGNITO_IDENTITY;
    }

    /**
     * @returns {string[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CognitoIdentityService}
     */
    value: function _setup(services) {
      var globalsConfig = this.property.config.globals;
      var identityProviders = globalsConfig.security && globalsConfig.security.identityProviders ? globalsConfig.security.identityProviders : {};

      this._createIdentityPool(identityProviders)((function (identityPool) {
        this._config.identityPool = identityPool;
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CognitoIdentityService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      this._setIdentityPoolRoles(this.config().identityPool)((function (roles) {
        this._config.roles = roles;
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {CognitoIdentityService}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      var lambdaArns = this.getAllLambdasArn(this.property.config.microservices);

      this._updateCognitoRolesPolicy(this._config.roles, lambdaArns)((function (policies) {
        this._config.postDeploy = {
          inlinePolicies: policies
        };
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @param {Object} identityProviders
     * @returns {function}
     * @private
     */
  }, {
    key: '_createIdentityPool',
    value: function _createIdentityPool(identityProviders) {
      var identityPoolName = this.generateName();

      var params = {
        AllowUnauthenticatedIdentities: true,
        IdentityPoolName: identityPoolName,
        DeveloperProviderName: CognitoIdentityService.DEVELOPER_PROVIDER_NAME,
        SupportedLoginProviders: identityProviders
      };

      var identityPool = null;
      var cognitoIdentity = this.provisioning.cognitoIdentity;
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      syncStack.push(cognitoIdentity.createIdentityPool(params), function (error, data) {
        if (error) {
          throw new _ExceptionFailedToCreateIdentityPoolException.FailedToCreateIdentityPoolException(identityPoolName, error);
        }

        identityPool = data;
      });

      return (function (callback) {
        return syncStack.join().ready((function () {
          callback(identityPool);
        }).bind(this));
      }).bind(this);
    }

    /**
     * @param {String} identityPool
     * @returns {function}
     * @private
     */
  }, {
    key: '_setIdentityPoolRoles',
    value: function _setIdentityPoolRoles(identityPool) {
      var _this = this;

      var iam = this.provisioning.iam;
      var roles = {};
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      var _loop = function (roleKey) {
        if (!CognitoIdentityService.ROLE_TYPES.hasOwnProperty(roleKey)) {
          return 'continue';
        }

        var roleType = CognitoIdentityService.ROLE_TYPES[roleKey];

        var roleParams = {
          AssumeRolePolicyDocument: _this._getAssumeRolePolicy(identityPool, roleType).toString(),
          RoleName: _this.generateAwsResourceName(roleType, _mitocgroupDeepCore2['default'].AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT)
        };

        syncStack.push(iam.createRole(roleParams), (function (error, data) {
          if (error) {
            throw new _ExceptionFailedToCreateIamRoleException.FailedToCreateIamRoleException(roleParams.RoleName, error);
          }

          roles[roleType] = data.Role;
        }).bind(_this));
      };

      for (var roleKey in CognitoIdentityService.ROLE_TYPES) {
        var _ret = _loop(roleKey);

        if (_ret === 'continue') continue;
      }

      return (function (callback) {
        return syncStack.join().ready((function () {
          var innerSyncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();
          var cognitoIdentity = this.provisioning.cognitoIdentity;

          var parameters = {
            IdentityPoolId: identityPool.IdentityPoolId,
            Roles: {
              authenticated: roles[CognitoIdentityService.ROLE_AUTH].Arn,
              unauthenticated: roles[CognitoIdentityService.ROLE_UNAUTH].Arn
            }
          };

          innerSyncStack.push(cognitoIdentity.setIdentityPoolRoles(parameters), (function (error, data) {
            if (error) {
              throw new _ExceptionFailedSettingIdentityPoolRolesException.FailedSettingIdentityPoolRolesException(identityPool.IdentityPoolName, error);
            }
          }).bind(this));

          innerSyncStack.join().ready((function () {
            callback(roles);
          }).bind(this));
        }).bind(this));
      }).bind(this);
    }

    /**
     * IAM role that is assumed by created Cognito identity pool
     *
     * @param identityPool
     * @param roleType
     * @returns {*}
     */
  }, {
    key: '_getAssumeRolePolicy',
    value: function _getAssumeRolePolicy(identityPool, roleType) {
      if (CognitoIdentityService.ROLE_TYPES.indexOf(roleType) === -1) {
        throw new _ExceptionException.Exception('Unknown role type ' + roleType + '.');
      }

      var rolePolicy = new _mitocgroupDeepCore2['default'].AWS.IAM.Policy();

      var statement = rolePolicy.statement.add();

      var action = statement.action.add();
      action.service = _mitocgroupDeepCore2['default'].AWS.Service.SECURITY_TOKEN_SERVICE;
      action.action = 'AssumeRoleWithWebIdentity';

      statement.principal = {
        Federated: _mitocgroupDeepCore2['default'].AWS.Service.identifier(_mitocgroupDeepCore2['default'].AWS.Service.COGNITO_IDENTITY)
      };

      statement.condition = {
        StringEquals: {
          'cognito-identity.amazonaws.com:aud': identityPool.IdentityPoolId
        },
        'ForAnyValue:StringLike': {
          'cognito-identity.amazonaws.com:amr': roleType
        }
      };

      return rolePolicy;
    }

    /**
     * Adds inline policies to Cognito auth and unauth roles
     *
     * @param {Object} cognitoRoles
     * @param {Object} lambdaARNs
     * @returns {function}
     * @private
     */
  }, {
    key: '_updateCognitoRolesPolicy',
    value: function _updateCognitoRolesPolicy(cognitoRoles, lambdaARNs) {
      var _this2 = this;

      var iam = this.provisioning.iam;
      var policies = {};
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      var _loop2 = function (cognitoRoleType) {
        if (!cognitoRoles.hasOwnProperty(cognitoRoleType)) {
          return 'continue';
        }

        var cognitoRole = cognitoRoles[cognitoRoleType];
        var lambdasForRole = lambdaARNs[cognitoRoleType];

        // skip role if there are no lambdas to add
        if (lambdasForRole.length <= 0) {
          return 'continue';
        }

        var policy = CognitoIdentityService.getAccessPolicyForResources(lambdasForRole);

        var params = {
          PolicyDocument: policy.toString(),
          PolicyName: _this2.generateAwsResourceName(cognitoRoleType + 'Policy', _mitocgroupDeepCore2['default'].AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT),
          RoleName: cognitoRole.RoleName
        };

        syncStack.push(iam.putRolePolicy(params), (function (error, data) {
          if (error) {
            throw new _ExceptionFailedAttachingPolicyToRoleException.FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
          }

          policies[params.RoleName] = policy;
        }).bind(_this2));
      };

      for (var cognitoRoleType in cognitoRoles) {
        var _ret2 = _loop2(cognitoRoleType);

        if (_ret2 === 'continue') continue;
      }

      return (function (callback) {
        return syncStack.join().ready((function () {
          callback(policies);
        }).bind(this));
      }).bind(this);
    }

    /**
     * Allow Cognito users to invoke these lambdas
     *
     * @param {Object} lambdaARNs
     * @returns {Core.AWS.IAM.Policy}
     */
  }, {
    key: 'getAllLambdasArn',

    /**
     * @temp - allow all lambdas to be invoked by unauth users
     *
     * Collect all lambdas arn from all microservices
     *
     * @param {Object} microservicesConfig
     * @returns {Object}
     */
    value: function getAllLambdasArn(microservicesConfig) {
      var lambdaArns = {};
      lambdaArns[CognitoIdentityService.ROLE_AUTH] = [];
      lambdaArns[CognitoIdentityService.ROLE_UNAUTH] = [];

      for (var microserviceIdentifier in microservicesConfig) {
        if (!microservicesConfig.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microservice = microservicesConfig[microserviceIdentifier];

        for (var resourceName in microservice.resources) {
          if (!microservice.resources.hasOwnProperty(resourceName)) {
            continue;
          }

          var resourceActions = microservice.resources[resourceName];

          for (var actionName in resourceActions) {
            if (!resourceActions.hasOwnProperty(actionName)) {
              continue;
            }

            var action = resourceActions[actionName];

            if (action.type !== _MicroserviceMetadataAction.Action.LAMBDA) {
              continue;
            }

            var actionIdentifier = resourceName + '-' + action.name;
            var lambdaArn = microservice.deployedServices.lambdas[actionIdentifier].FunctionArn;

            lambdaArns[CognitoIdentityService.ROLE_UNAUTH].push(lambdaArn);
            lambdaArns[CognitoIdentityService.ROLE_AUTH].push(lambdaArn);
          }
        }
      }

      return lambdaArns;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'generateName',
    value: function generateName() {
      return this.generateAwsResourceName('IdentityPool', _mitocgroupDeepCore2['default'].AWS.Service.COGNITO_IDENTITY);
    }
  }], [{
    key: 'getAccessPolicyForResources',
    value: function getAccessPolicyForResources(lambdaARNs) {
      var policy = new _mitocgroupDeepCore2['default'].AWS.IAM.Policy();

      var statement = policy.statement.add();
      var action = statement.action.add();

      action.service = _mitocgroupDeepCore2['default'].AWS.Service.LAMBDA;
      action.action = 'InvokeFunction';

      for (var lambdaArnKey in lambdaARNs) {
        if (!lambdaARNs.hasOwnProperty(lambdaArnKey)) {
          continue;
        }

        var lambdaArn = lambdaARNs[lambdaArnKey];
        var resource = statement.resource.add();

        resource.updateFromArn(lambdaArn);
      }

      return policy;
    }
  }, {
    key: 'DEVELOPER_PROVIDER_NAME',
    get: function get() {
      return 'deep.mg';
    }

    /**
     * @returns {string}
     */
  }, {
    key: 'ROLE_AUTH',
    get: function get() {
      return 'authenticated';
    }

    /**
     * @returns {string}
     */
  }, {
    key: 'ROLE_UNAUTH',
    get: function get() {
      return 'unauthenticated';
    }

    /**
     * @returns {Array}
     */
  }, {
    key: 'ROLE_TYPES',
    get: function get() {
      return [CognitoIdentityService.ROLE_AUTH, CognitoIdentityService.ROLE_UNAUTH];
    }
  }, {
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.US_EAST_N_VIRGINIA, _mitocgroupDeepCore2['default'].AWS.Region.EU_IRELAND];
    }
  }]);

  return CognitoIdentityService;
})(_AbstractService2.AbstractService);

exports.CognitoIdentityService = CognitoIdentityService;