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

var _S3Service = require('./S3Service');

var _DynamoDBService = require('./DynamoDBService');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _HelpersAwsRequestSyncStack = require('../../Helpers/AwsRequestSyncStack');

var _ExceptionFailedToCreateIamRoleException = require('./Exception/FailedToCreateIamRoleException');

var _ExceptionFailedAttachingPolicyToRoleException = require('./Exception/FailedAttachingPolicyToRoleException');

var _MicroserviceMetadataAction = require('../../Microservice/Metadata/Action');

var _PropertyLambda = require('../../Property/Lambda');

/**
 * Lambda service
 */

var LambdaService = (function (_AbstractService) {
  _inherits(LambdaService, _AbstractService);

  /**
   * @param {Array} args
   */

  function LambdaService() {
    _classCallCheck(this, LambdaService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(LambdaService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(LambdaService, [{
    key: 'name',
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.LAMBDA;
    }

    /**
     * @returns {String[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {LambdaService}
     */
    value: function _setup(services) {
      var microservices = this.provisioning.property.microservices;

      this._createExecRoles(microservices)((function (execRoles) {
        this._config = {
          names: this._generateLambdasNames(microservices),
          executionRoles: execRoles
        };
        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {LambdaService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      var buckets = services.find(_S3Service.S3Service).config().buckets;
      var dynamoDbTablesNames = services.find(_DynamoDBService.DynamoDBService).config().tablesNames;

      this._attachPolicyToExecRoles(buckets, this._config.executionRoles, dynamoDbTablesNames)((function (policies) {
        this._config.executionRolesPolicies = policies;
        this._ready = true;
      }).bind(this));

      this._ready = true;

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

    /**
     * Creates execution roles for each lambda
     *
     * @param {Object} microservices
     *
     * @returns {Function}
     * @private
     */
  }, {
    key: '_createExecRoles',
    value: function _createExecRoles(microservices) {
      var _this = this;

      var iam = this.provisioning.iam;
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();
      var execRoles = {};
      var execRolePolicy = LambdaService.getExecRolePolicy(); // role policy (definition) is common for all lambdas

      var _loop = function (microserviceKey) {
        if (!microservices.hasOwnProperty(microserviceKey)) {
          return 'continue';
        }

        var microservice = microservices[microserviceKey];

        execRoles[microservice.identifier] = {};

        var _loop2 = function (actionKey) {
          if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
            return 'continue';
          }

          var action = microservice.resources.actions[actionKey];

          if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
            (function () {
              var roleName = _this.generateAwsResourceName(_this._actionIdentifierToPascalCase(action.identifier) + 'Exec', _mitocgroupDeepCore2['default'].AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT, microservice.identifier);

              var params = {
                AssumeRolePolicyDocument: execRolePolicy.toString(),
                RoleName: roleName
              };

              syncStack.push(iam.createRole(params), (function (error, data) {
                if (error) {
                  // @todo: remove this hook
                  if (_PropertyLambda.Lambda.isErrorFalsePositive(error)) {
                    return;
                  }

                  throw new _ExceptionFailedToCreateIamRoleException.FailedToCreateIamRoleException(roleName, error);
                }

                execRoles[microservice.identifier][action.identifier] = data.Role;
              }).bind(_this));
            })();
          }
        };

        for (var actionKey in microservice.resources.actions) {
          var _ret2 = _loop2(actionKey);

          if (_ret2 === 'continue') continue;
        }
      };

      for (var microserviceKey in microservices) {
        var _ret = _loop(microserviceKey);

        if (_ret === 'continue') continue;
      }

      return (function (callback) {
        return syncStack.join().ready((function () {
          callback(execRoles);
        }).bind(this));
      }).bind(this);
    }

    /**
     * @param {Object} microservices
     * @returns {Object}
     * @private
     */
  }, {
    key: '_generateLambdasNames',
    value: function _generateLambdasNames(microservices) {
      var names = {};

      for (var microserviceKey in microservices) {
        if (!microservices.hasOwnProperty(microserviceKey)) {
          continue;
        }

        var microservice = microservices[microserviceKey];

        names[microservice.identifier] = {};

        for (var actionKey in microservice.resources.actions) {
          if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
            continue;
          }

          var action = microservice.resources.actions[actionKey];

          if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
            names[microservice.identifier][action.identifier] = this.generateAwsResourceName(this._actionIdentifierToPascalCase(action.identifier), _mitocgroupDeepCore2['default'].AWS.Service.LAMBDA, microservice.identifier);
          }
        }
      }

      return names;
    }

    /**
     * Adds inline policies to lambdas execution roles
     *
     * @param {Array} buckets
     * @param {String} roles
     * @param {String} dynamoDbTablesNames
     * @returns {*}
     * @private
     */
  }, {
    key: '_attachPolicyToExecRoles',
    value: function _attachPolicyToExecRoles(buckets, roles, dynamoDbTablesNames) {
      var _this2 = this;

      var iam = this.provisioning.iam;
      var policies = {};
      var syncStack = new _HelpersAwsRequestSyncStack.AwsRequestSyncStack();

      for (var microserviceIdentifier in roles) {
        if (!roles.hasOwnProperty(microserviceIdentifier)) {
          continue;
        }

        var microserviceRoles = roles[microserviceIdentifier];

        var _loop3 = function (lambdaIdentifier) {
          if (!microserviceRoles.hasOwnProperty(lambdaIdentifier)) {
            return 'continue';
          }

          var execRole = microserviceRoles[lambdaIdentifier];

          var policyName = _this2.generateAwsResourceName(_this2._actionIdentifierToPascalCase(lambdaIdentifier) + 'Policy', _mitocgroupDeepCore2['default'].AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT, microserviceIdentifier);

          var policy = LambdaService.getAccessPolicy(microserviceIdentifier, buckets, dynamoDbTablesNames);

          var params = {
            PolicyDocument: policy.toString(),
            PolicyName: policyName,
            RoleName: execRole.RoleName
          };

          syncStack.push(iam.putRolePolicy(params), (function (error, data) {
            if (error) {
              throw new _ExceptionFailedAttachingPolicyToRoleException.FailedAttachingPolicyToRoleException(policyName, execRole.RoleName, error);
            }

            policies[execRole.RoleName] = policy;
          }).bind(_this2));
        };

        for (var lambdaIdentifier in microserviceRoles) {
          var _ret4 = _loop3(lambdaIdentifier);

          if (_ret4 === 'continue') continue;
        }
      }

      return (function (callback) {
        return syncStack.join().ready((function () {
          callback(policies);
        }).bind(this));
      }).bind(this);
    }

    /**
     * Creates lambda execution role default definition without access policy
     *
     * @returns {Policy}
     */
  }, {
    key: '_actionIdentifierToPascalCase',

    /**
     * @todo - use https://github.com/blakeembrey/pascal-case node package instead
     *
     * @param {String} actionName
     * @returns {String}
     * @private
     */
    value: function _actionIdentifierToPascalCase(actionName) {
      var pascalCase = '';

      actionName.split('-').forEach(function (part) {
        pascalCase += _AbstractService2.AbstractService.capitalizeFirst(part);
      });

      return pascalCase;
    }
  }], [{
    key: 'getExecRolePolicy',
    value: function getExecRolePolicy() {
      var execRolePolicy = new _mitocgroupDeepCore2['default'].AWS.IAM.Policy();

      var statement = execRolePolicy.statement.add();
      statement.principal = {
        Service: _mitocgroupDeepCore2['default'].AWS.Service.identifier(_mitocgroupDeepCore2['default'].AWS.Service.LAMBDA)
      };

      var action = statement.action.add();
      action.service = _mitocgroupDeepCore2['default'].AWS.Service.SECURITY_TOKEN_SERVICE;
      action.action = 'AssumeRole';

      return execRolePolicy;
    }

    /**
     * Allows lambda function access to all microservice resources (FS s3 buckets, DynamoDD tables, etc.)
     *
     * @param {String} microserviceIdentifier
     * @param {Array} buckets
     * @param {String} dynamoDbTablesNames
     *
     * @returns {Policy}
     */
  }, {
    key: 'getAccessPolicy',
    value: function getAccessPolicy(microserviceIdentifier, buckets, dynamoDbTablesNames) {
      var policy = new _mitocgroupDeepCore2['default'].AWS.IAM.Policy();

      var logsStatement = policy.statement.add();
      var logsAction = logsStatement.action.add();

      logsAction.service = _mitocgroupDeepCore2['default'].AWS.Service.CLOUD_WATCH_LOGS;
      logsAction.action = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;

      var logsResource = logsStatement.resource.add();

      logsResource.service = _mitocgroupDeepCore2['default'].AWS.Service.CLOUD_WATCH_LOGS;
      logsResource.region = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;
      logsResource.accountId = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;
      logsResource.descriptor = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;

      var dynamoDbStatement = policy.statement.add();
      var dynamoDbAction = dynamoDbStatement.action.add();

      dynamoDbAction.service = _mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB;
      dynamoDbAction.action = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;

      for (var modelName in dynamoDbTablesNames) {
        if (!dynamoDbTablesNames.hasOwnProperty(modelName)) {
          continue;
        }

        var tableName = dynamoDbTablesNames[modelName];
        var dynamoDbResource = dynamoDbStatement.resource.add();

        dynamoDbResource.service = _mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB;
        dynamoDbResource.region = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;
        dynamoDbResource.accountId = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;
        dynamoDbResource.descriptor = 'table/' + tableName;
      }

      var s3Statement = policy.statement.add();

      var s3Action = s3Statement.action.add();

      s3Action.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
      s3Action.action = _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;

      for (var bucketSuffix in buckets) {
        if (!buckets.hasOwnProperty(bucketSuffix)) {
          continue;
        }

        var bucket = buckets[bucketSuffix];
        var s3Resource = s3Statement.resource.add();

        s3Resource.service = _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE;
        s3Resource.descriptor = bucket.name + '/' + microserviceIdentifier + '/' + _mitocgroupDeepCore2['default'].AWS.IAM.Policy.ANY;
      }

      return policy;
    }
  }, {
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.US_EAST_N_VIRGINIA, _mitocgroupDeepCore2['default'].AWS.Region.US_WEST_OREGON, _mitocgroupDeepCore2['default'].AWS.Region.EU_IRELAND];
    }
  }]);

  return LambdaService;
})(_AbstractService2.AbstractService);

exports.LambdaService = LambdaService;