/**
 * Created by mgoria on 9/11/15.
 */

/*eslint max-len: 0, no-unused-vars: 0*/

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateApiGatewayException} from './Exception/FailedToCreateApiGatewayException';
import {FailedToCreateApiResourceException} from './Exception/FailedToCreateApiResourceException';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {FailedToDeployApiGatewayException} from './Exception/FailedToDeployApiGatewayException';
import {FailedToExecuteApiGatewayMethodException} from './Exception/FailedToExecuteApiGatewayMethodException';
import {FailedToListApiResourcesException} from './Exception/FailedToListApiResourcesException';
import {FailedToDeleteApiResourceException} from './Exception/FailedToDeleteApiResourceException';
import {InvalidCacheClusterSizeException} from './Exception/InvalidCacheClusterSizeException';
import {InvalidApiLogLevelException} from './Exception/InvalidApiLogLevelException';
import {FailedToUpdateApiGatewayStageException} from './Exception/FailedToUpdateApiGatewayStageException';
import {FailedToUpdateApiGatewayAccountException} from './Exception/FailedToUpdateApiGatewayAccountException';
import {FailedToDeleteApiException} from './Exception/FailedToDeleteApiException';
import {Action} from '../../Microservice/Metadata/Action';
import {IAMService} from './IAMService';
import {LambdaService} from './LambdaService';
import {CloudWatchLogsService} from './CloudWatchLogsService';
import objectMerge from 'object-merge';
import nodePath from 'path';
import jsonPointer from 'json-pointer';
import {ActionFlags} from '../../Microservice/Metadata/Helpers/ActionFlags';

/**
 * APIGateway service
 */
export class APIGatewayService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._apiResources = {};
    this._nonDirectLambdaIdentifiers = [];
  }

  /**
   * @returns {String}
   */
  static get API_NAME_PREFIX() {
    return 'Api';
  }

  /**
   * @returns {Number}
   */
  static get PAGE_LIMIT() {
    return 500;
  }

  /**
   * Max retries on request fails
   *
   * @returns {Number}
   */
  static get MAX_RETRIES() {
    return 3;
  }

  /**
   * Retry interval (ms)
   *
   * @returns {Number}
   */
  static get RETRY_INTERVAL() {
    return 600;
  }

  /**
   * @returns {String[]}
   */
  static get CACHE_CLUSTER_SIZES() {
    return ['0.5', '1.6', '6.1', '13.5', '28.4', '58.2', '118', '237'];
  }

  /**
   * @returns {String[]}
   */
  static get LOG_LEVELS() {
    return ['OFF', 'INFO', 'ERROR'];
  }

  /**
   * A query string parameter added to all GET endpoints with enabled cache
   * It's used to invalidate cache when query string is changed
   *
   * @example _deepQsHash = md5(all_query_string_params)
   *
   * @returns {string}
   */
  static get DEEP_CACHE_QS_PARAM() {
    return 'method.request.querystring._deepQsHash';
  }

  /**
   * @returns {String}
   */
  static get ORIGINAL_REQUEST_ID_HEADER() {
    return 'x-amzn-original-RequestId';
  }

  /**
   * @returns {String[]}
   */
  static get ALLOWED_CORS_HEADERS() {
    return ['Content-Type', 'X-Amz-Date', 'X-Amz-Security-Token', 'Authorization', 'x-api-key'];
  }

  /**
   * @returns {String[]}
   */
  static get ALLOWED_EXPOSED_HEADERS() {
    return ['x-amzn-RequestId', APIGatewayService.ORIGINAL_REQUEST_ID_HEADER];
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.API_GATEWAY;
  }

  /**
   * @returns {Object}
   */
  get apiGatewayClient() {
    return this.provisioning.apiGateway;
  }

  /**
   * API default metadata
   *
   * @returns {Object}
   */
  get apiMetadata() {
    return {
      name: this.generateAwsResourceName(APIGatewayService.API_NAME_PREFIX, Core.AWS.Service.API_GATEWAY),
      description:`This API is generated automatically by DEEP for #${this.appIdentifier} app.`,
    };
  }

  /**
   * @returns {String}
   */
  get stageName() {
    return this.env;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.US_WEST_OREGON,
      Core.AWS.Region.EU_IRELAND,
      Core.AWS.Region.EU_FRANKFURT,
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
      Core.AWS.Region.ASIA_PACIFIC_SINGAPORE,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   * @private
   *
   * @todo: remove config.api key and put object to the root
   */
  _setup(services) {
    let resourcePaths = this._getResourcePaths(this.property.microservices);

    // do not create an API instance if there are no resources
    if (resourcePaths.length === 0) {
      if (this.isUpdate && this._config.api && this._config.api.id) {
        this._deleteApi(this._config.api.id, () => {
          this._config.api = {};
          this._ready = true;
        });

      } else {
        this._config.api = {};
        this._ready = true;
      }

      return this;
    }

    this._provisionApiResources(
      this.apiMetadata,
      resourcePaths
    )((api, resources, role) => {
      // @todo: remove this hook
      this._config.api = this._config.api || {};

      this._config.api.id = api.id;
      this._config.api.name = api.name;
      this._config.api.baseUrl = api.baseUrl;
      this._config.api.role = role;
      this._config.api.resources = objectMerge(this._config.api.resources, resources);

      this._ready = true;
    });

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   * @private
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   * @private
   */
  _postDeployProvision(services) {
    if (!this._config.api.hasOwnProperty('id')) {
      this._ready = true;
      return this;
    }

    this._nonDirectLambdaIdentifiers = this.provisioning.services.find(LambdaService)
      .extractFunctionIdentifiers(ActionFlags.NON_DIRECT_ACTION_FILTER);

    let integrationParams = this.getResourcesIntegrationParams(this.property.config.microservices);

    this._putApiIntegrations(
      this._config.api.id,
      this._config.api.resources,
      this._config.api.role,
      integrationParams
    )((methods, integrations, rolePolicy, deployedApi) => {
      this._config.api.methods = methods;
      this._config.api.integrations = integrations;
      this._config.api.rolePolicy = rolePolicy;
      this._config.api.deployedApi = deployedApi;

      // generate cloud watch log group name for deployed API Gateway
      if (this.apiConfig.cloudWatch.logging.enabled || this.apiConfig.cloudWatch.metrics) {
        this._config.api.logGroupName = this._generateApiLogGroupName(this._config.api.id, this.stageName);
      }

      this._ready = true;
    });

    return this;
  }

  /**
   * @returns {Object}
   */
  get apiConfig() {
    // default config
    let config = {
      cache: {
        enabled: false,
        clusterSize: '0.5',
      },
      cloudWatch: {
        metrics: false,
        logging: {
          enabled: false,
          logLevel: 'OFF',
          dataTrace: false,
        },
      },
    };

    let globalsConfig = this.property.config.globals;
    if (globalsConfig && globalsConfig.hasOwnProperty('api')) {
      config = objectMerge(config, globalsConfig.api);
    }

    if (APIGatewayService.CACHE_CLUSTER_SIZES.indexOf(config.cache.clusterSize) === -1) {
      throw new InvalidCacheClusterSizeException(
        config.cache.clusterSize, APIGatewayService.CACHE_CLUSTER_SIZES
      );
    }

    if (APIGatewayService.LOG_LEVELS.indexOf(config.cloudWatch.logging.logLevel) === -1) {
      throw new InvalidApiLogLevelException(
        config.cloudWatch.logging.logLevel, APIGatewayService.LOG_LEVELS
      );
    }

    return config;
  }

  /**
   * @param {Object} metadata
   * @param {Array} resourcePaths
   * @returns {Function}
   * @private
   */
  _provisionApiResources(metadata, resourcePaths) {
    let restApi = this.isUpdate ? this._config.api : null;
    let restApiIamRole = this.isUpdate ? this._config.api.role : null;
    let restResources = this.isUpdate ? this._config.api.resources : null;

    return (callback) => {
      if (this.isUpdate) {
        // recreate all resources to make sure all changes to resources.json are applied to API Gateway endpoints
        this._removeOldResources(restApi.id, restResources, () => {
          this._createApiResources(resourcePaths, restApi.id, (resources) => {
            callback(restApi, this._extractApiResourcesMetadata(resources), restApiIamRole);
          });
        });

        return;
      }

      this._createApi(metadata, (api) => {
        restApi = api;

        this._createApiResources(resourcePaths, restApi.id, (resources) => {
          restResources = resources;

          this._createApiIamRole((role) => {
            restApiIamRole = role;

            callback(restApi, this._extractApiResourcesMetadata(restResources), restApiIamRole);
          });
        });
      });
    };
  }

  /**
   * @param {String} apiId
   * @param {Object} apiResources
   * @param {Object} apiRole
   * @param {Object} integrationParams
   * @returns {Function}
   * @private
   */
  _putApiIntegrations(apiId, apiResources, apiRole, integrationParams) {
    var methods = null;
    var methodsResponse = null;
    var integrations = null;
    var integrationsResponse = null;
    var rolePolicy = null;

    return (callback) => {
      this._executeProvisionMethod('putMethod', apiId, apiResources, integrationParams, (data) => {
        methods = data;

        this._executeProvisionMethod('putMethodResponse', apiId, apiResources, integrationParams, (data) => {
          methodsResponse = data;

          this._executeProvisionMethod('putIntegration', apiId, apiResources, integrationParams, (data) => {
            integrations = data;

            this._executeProvisionMethod('putIntegrationResponse', apiId, apiResources, integrationParams, (data) => {
              integrationsResponse = data;

              this._addPolicyToApiRole(apiRole, (data) => {
                rolePolicy = data;

                this._deployApi(apiId, (deployedApi) => {

                  this._updateStage(apiId, this.stageName, apiRole, this.apiConfig, (data) => {
                    callback(methods, integrations, rolePolicy, deployedApi);
                  });
                });
              });
            });
          });
        });
      });
    };
  }

  /**
   * @param {Object} metadata
   * @param {Function} callback
   * @private
   */
  _createApi(metadata, callback) {
    this.apiGatewayClient.createRestApi(metadata, (error, api) => {
      if (error) {
        throw new FailedToCreateApiGatewayException(metadata.name, error);
      }

      // generate base url for created API coz it's not returned by createRestApi method
      api.baseUrl = this._generateApiBaseUrl(api.id, this.apiGatewayClient.config.region, this.stageName);

      callback(api);
    });
  }

  /**
   * @param {Function} callback
   * @private
   */
  _createApiIamRole(callback) {
    let iam = this.provisioning.iam;
    let roleName = this.generateAwsResourceName(
      `${APIGatewayService.API_NAME_PREFIX}ExecAccess`,
      Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
    );

    let params = {
      AssumeRolePolicyDocument: IAMService.getAssumeRolePolicy(Core.AWS.Service.API_GATEWAY).toString(),
      RoleName: roleName,
    };

    iam.createRole(params, (error, data) => {
      if (error) {
        throw new FailedToCreateIamRoleException(roleName, error);
      }

      callback(data.Role);
    });
  }

  /**
   * @param {String} method
   * @param {String} apiId
   * @param {Object} apiResources
   * @param {Object} integrationParams
   * @param {Function} callback
   * @private
   */
  _executeProvisionMethod(method, apiId, apiResources, integrationParams, callback) {
    let clonedIntegrationParams = objectMerge(integrationParams, {});

    let methodsParams = this._methodParamsGenerator(method, apiId, apiResources, clonedIntegrationParams);
    let retriesMap = [];
    let dataStack = {};

    /**
     * @param {Number} methodIndex
     * @param {Function} onCompleteCallback
     */
    function executeSingleMethod(methodIndex, onCompleteCallback) {
      if (!methodsParams.hasOwnProperty(methodIndex)) {
        onCompleteCallback();

        return;
      }

      let params = methodsParams[methodIndex];
      let retries = retriesMap[methodIndex] || (retriesMap[methodIndex] = 0);
      let resourcePath = params.resourcePath;
      delete params.resourcePath;

      this.apiGatewayClient[method](params, (error, data) => {
        if (error) {
          if (retries <= APIGatewayService.MAX_RETRIES) {
            retriesMap[methodIndex]++;

            setTimeout(
              executeSingleMethod.bind(this),
              APIGatewayService.RETRY_INTERVAL * retriesMap[methodIndex],
              methodIndex,
              onCompleteCallback
            );

            return;
          }

          throw new FailedToExecuteApiGatewayMethodException(method, resourcePath, params.httpMethod, error);
        }

        dataStack[resourcePath] = {};
        dataStack[resourcePath][params.httpMethod] = data;

        executeSingleMethod.bind(this)(++methodIndex, onCompleteCallback);
      });
    }

    executeSingleMethod.bind(this)(0, () => {
      callback(dataStack);
    });
  }

  /**
   * @param {String} apiId
   * @param {Function} callback
   * @private
   */
  _deployApi(apiId, callback) {
    let params = {
      restApiId: apiId,
      stageName: this.stageName,
      cacheClusterEnabled: this.apiConfig.cache.enabled,
      cacheClusterSize: this.apiConfig.cache.clusterSize,
      stageDescription: `Stage for "${this.env}" environment`,
      description: `Deployed on ${new Date().toTimeString()}`,
    };

    this.apiGatewayClient.createDeployment(params, (error, data) => {
      if (error) {
        throw new FailedToDeployApiGatewayException(apiId, error);
      }

      callback(data);
    });
  }

  /**
   * @param {String} apiId
   * @param {Function} callback
   * @private
   */
  _deleteApi(apiId, callback) {
    this.apiGatewayClient.deleteRestApi({restApiId: apiId}, (error, data) => {
      if (error) {
        throw new FailedToDeleteApiException(apiId, error);
      }

      callback(data);
    });
  }

  /**
   * @param {String} apiId
   * @param {String} stageName
   * @param {Object} apiRole
   * @param {Object} apiConfig
   * @param {Function} callback
   * @private
   */
  _updateStage(apiId, stageName, apiRole, apiConfig, callback) {
    let params = {
      restApiId: apiId,
      stageName: stageName,
      patchOperations: [],
    };

    params.patchOperations = params.patchOperations.concat(
      this._getStageUpdateOpsForCache(apiConfig.cache)
    );

    params.patchOperations = params.patchOperations.concat(
      this._getStageUpdateOpsForLogs(apiConfig.cloudWatch)
    );

    this._updateAccount(apiRole, apiConfig, (data) => {

      if (params.patchOperations.length === 0) {
        callback(null);
        return;
      }

      this.apiGatewayClient.updateStage(params, (error, data) => {
        if (error) {
          throw new FailedToUpdateApiGatewayStageException(apiId, stageName, error);
        }

        callback(data);
      });
    });
  }

  /**
   * @param {Object} apiRole
   * @param {Object} apiConfig
   * @param {Function} callback
   * @private
   */
  _updateAccount(apiRole, apiConfig, callback) {
    let params = {
      patchOperations: [],
    };

    if (apiConfig.cloudWatch.logging.enabled || apiConfig.cloudWatch.metrics) {
      params.patchOperations.push({
        op: 'replace',
        path: '/cloudwatchRoleArn',
        value: apiRole.Arn,
      });
    }

    if (params.patchOperations.length === 0) {
      callback();
      return;
    }

    var retries = 0;
    var updateAccountFunc = () => {
      this.apiGatewayClient.updateAccount(params, (error, data) => {
        if (error) {
          if (retries <= APIGatewayService.MAX_RETRIES) {
            retries++;
            setTimeout(updateAccountFunc, APIGatewayService.RETRY_INTERVAL * retries);
          } else {
            throw new FailedToUpdateApiGatewayAccountException(
              this.apiGatewayClient.config.region, params, error
            );
          }
        } else {
          callback(data);
        }
      });
    };

    updateAccountFunc();
  }

  /**
   * @param {Object} cacheConfig
   * @returns {Array}
   * @private
   */
  _getStageUpdateOpsForCache(cacheConfig) {
    let operations = [];

    if (!cacheConfig.enabled) {
      return operations;
    }

    let resources = this._getResourcesToBeCached(this.property.microservices);

    for (let resourcePath in resources) {
      if (!resources.hasOwnProperty(resourcePath)) {
        continue;
      }

      let resource = resources[resourcePath];

      let enabledOp = {
        op: 'replace',
        path: `/${jsonPointer.escape(resourcePath)}/GET/caching/enabled`,
        value: 'true',
      };

      let ttlInSecondsOp = {
        op: 'replace',
        path: `/${jsonPointer.escape(resourcePath)}/GET/caching/ttlInSeconds`,
        value: `${resource.cacheTtl}`,
      };

      operations.push(enabledOp, ttlInSecondsOp);
    }

    return operations;
  }

  /**
   * @param {Object} logsConfig
   * @returns {Array}
   * @private
   */
  _getStageUpdateOpsForLogs(logsConfig) {
    let operations = [];

    if (logsConfig.logging.enabled) {
      operations.push(
        {
          op: 'replace',
          path: '/*/*/logging/loglevel',
          value: logsConfig.logging.logLevel,
        },
        {
          op: 'replace',
          path: '/*/*/logging/dataTrace',
          value: `${logsConfig.logging.dataTrace}`,
        }
      );
    }

    if (logsConfig.metrics) {
      operations.push({
        op: 'replace',
        path: '/*/*/metrics/enabled',
        value: `${logsConfig.metrics}`,
      });
    }

    return operations;
  }

  /**
   * @param {Object} apiRole
   * @param {Function} callback
   * @private
   */
  _addPolicyToApiRole(apiRole, callback) {
    let lambdaService = this.provisioning.services.find(LambdaService);
    let cloudWatchService = this.provisioning.services.find(CloudWatchLogsService);

    let iam = this.provisioning.iam;
    let policy = new Core.AWS.IAM.Policy();
    policy.statement.add(lambdaService.generateAllowActionsStatement());
    policy.statement.add(cloudWatchService.generateAllowFullAccessStatement());

    let params = {
      PolicyDocument: policy.toString(),
      PolicyName: this.generateAwsResourceName(
        `${APIGatewayService.API_NAME_PREFIX}ExecAccessPolicy`,
        Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
      ),
      RoleName: apiRole.RoleName,
    };

    iam.putRolePolicy(params, (error, data) => {
      if (error) {
        throw new FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
      }

      callback(policy);
    });
  }

  /**
   * @param {String} method
   * @param {String} apiId
   * @param {Object} apiResources
   * @param {Object} integrationParams
   * @returns {Array}
   * @private
   */
  _methodParamsGenerator(method, apiId, apiResources, integrationParams) {
    let paramsArr = [];

    for (let resourcePath in integrationParams) {
      if (!integrationParams.hasOwnProperty(resourcePath) || !apiResources.hasOwnProperty(resourcePath)) {
        continue;
      }

      let resourceMethods = integrationParams[resourcePath];
      let apiResource = apiResources[resourcePath];

      for (let resourceMethod in resourceMethods) {
        if (!resourceMethods.hasOwnProperty(resourceMethod)) {
          continue;
        }

        let commonParams = {
          resourcePath: resourcePath,
          httpMethod: resourceMethod,
          restApiId: apiId,
          resourceId: apiResource.id,
        };
        let methodParams = [];
        let integrationParams = resourceMethods[resourceMethod];
        let authType = integrationParams.authorizationType;
        let apiKeyRequired = integrationParams.apiKeyRequired;
        delete integrationParams.authorizationType;
        delete integrationParams.apiKeyRequired;

        switch (method) {
          case 'putMethod':
            methodParams.push({
              authorizationType: authType,
              apiKeyRequired: apiKeyRequired,
              requestModels: this.jsonEmptyModel,
              requestParameters: this._getMethodRequestParameters(resourceMethod, integrationParams),
            });
            break;
          case 'putMethodResponse':
            this.methodStatusCodes(resourceMethod).forEach((statusCode) => {
              methodParams.push({
                statusCode: `${statusCode}`,
                responseModels: this.jsonEmptyModel,
                responseParameters: this._getMethodResponseParameters(resourceMethod),
              });
            });
            break;
          case 'putIntegration':
            integrationParams.credentials = resourceMethod === 'OPTIONS' ?
              null :
              this._decideMethodIntegrationCredentials(integrationParams, authType);

            methodParams.push(integrationParams);
            break;
          case 'putIntegrationResponse':
            this.methodStatusCodes(resourceMethod).forEach((statusCode) => {
              methodParams.push({
                statusCode: `${statusCode}`,
                responseTemplates: this.getJsonResponseTemplate(resourceMethod),
                responseParameters: this._getMethodResponseParameters(resourceMethod, Object.keys(resourceMethods)),
                selectionPattern: this._getSelectionPattern(statusCode),
              });
            });
            break;
          default:
            throw new Exception(`Unknown api method ${method}.`);
        }

        methodParams.forEach((params) => {
          paramsArr.push(objectMerge(commonParams, params));
        });
      }
    }

    return paramsArr;
  }

  /**
   * This method disables invocation with caller credentials
   * for "non direct call" lambdas
   *
   * @param {Object} params
   * @param {String} authType
   * @returns {String}
   * @private
   */
  _decideMethodIntegrationCredentials(params, authType) {
    let credentials = 'arn:aws:iam::*:user/*';

    if (params.type === 'AWS' && params.uri) {
      let invocationArn = params.uri;
      let lambdaNameMatches = invocationArn.match(APIGatewayService.INVOCATION_SOURCE_ARN_REGEX);

      if (lambdaNameMatches && lambdaNameMatches.length === 2) {
        if (this._nonDirectLambdaIdentifiers.indexOf(lambdaNameMatches[1]) !== -1) {
          credentials = this._config.api.role.Arn;
        }
      }

      // Allow non-authorized API Gateway endpoints to invoke lambda functions based on API Gateway exec role
      if (authType === Action.AUTH_TYPE_NONE) {
        credentials = this._config.api.role.Arn;
      }
    }

    return credentials;
  }

  /**
   * @param {String} statusCode
   * @returns {String}
   * @private
   */
  _getSelectionPattern(statusCode) {
    let pattern = null;

    switch (parseInt(statusCode)) {
      case 200:
        pattern = '-';
        break;
      case 500:
        pattern = `.*\\"${this.deepStatusCodeKey}\\":${statusCode}.*|Process exited before completing request`;
        break;
      default:
        pattern = `.*\\"${this.deepStatusCodeKey}\\":${statusCode}.*`;
    }

    return pattern;
  }

  /**
   * @returns {RegExp}
   */
  static get INVOCATION_SOURCE_ARN_REGEX() {
    return /^arn:aws:apigateway:[^:]+:lambda:path\/[^\/]+\/functions\/arn:aws:lambda:[^:]+:[^:]+:function:([^:\/]+)\/invocations/i;
  }

  /**
   * All resources to be cached by API Gateway cache
   *
   * microservice_identifier
   *    resource_name
   *        action_name
   *
   * @param {Object} microservices
   * @returns {Object}
   * @private
   */
  _getResourcesToBeCached(microservices) {
    let resources = {};

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      for (let actionKey in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = microservice.resources.actions[actionKey];

        if (action.cacheEnabled && action.methods.indexOf('GET') !== -1) {
          let path = APIGatewayService.pathify(microservice.identifier, action.resourceName, action.name);
          resources[path] = action;
        }
      }
    }

    return resources;
  }

  /**
   * All resources to be created in API Gateway
   *
   * microservice_identifier
   *    resource_name
   *        action_name
   *
   * @param {Object} microservices
   * @returns {String[]}
   * @private
   */
  _getResourcePaths(microservices) {
    let resourcePaths = [];

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];
      let actions = microservice.resources.actions.filter(ActionFlags.API_ACTION_FILTER);

      if (actions.length > 0) {
        resourcePaths.push(APIGatewayService.pathify(microservice.identifier));
      }

      for (let actionKey in actions) {
        if (!actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = actions[actionKey];
        let resourcePath = APIGatewayService.pathify(microservice.identifier, action.resourceName);

        // push actions parent resource only once
        if (resourcePaths.indexOf(resourcePath) === -1) {
          resourcePaths.push(resourcePath);
        }

        resourcePaths.push(
          APIGatewayService.pathify(microservice.identifier, action.resourceName, action.name)
        );
      }
    }

    return resourcePaths;
  }

  /**
   * @param {String} microserviceIdentifier
   * @param {String} resourceName
   * @param {String} actionName
   *
   * @return {String}
   */
  static pathify(microserviceIdentifier, resourceName = '', actionName = '') {
    let path = `/${microserviceIdentifier}`;

    if (resourceName) {
      path += `/${resourceName}`;
    }

    if (actionName) {
      path += `/${actionName}`;
    }

    return path.replace(/\./g, '-'); // API Gateway does not support dots into resource name / path
  }

  /**
   * @param {Array} rawResources
   * @returns {Object}
   * @private
   */
  _extractApiResourcesMetadata(rawResources) {
    let resourcesMetadata = {};

    for (let rawResourceKey in rawResources) {
      if (!rawResources.hasOwnProperty(rawResourceKey)) {
        continue;
      }

      let rawResource = rawResources[rawResourceKey];

      resourcesMetadata[rawResource.path] = {
        id: rawResource.id,
        parentId: rawResource.parentId,
        path: rawResource.path,
        pathPart: rawResource.pathPart,
      };
    }

    return resourcesMetadata;
  }

  /**
   * Collect and compose microservice resources integration URIs
   *
   * @param {Object} microservicesConfig
   * @returns {Object}
   */
  getResourcesIntegrationParams(microservicesConfig) {
    let integrationParams = {};

    for (let microserviceIdentifier in microservicesConfig) {
      if (!microservicesConfig.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = microservicesConfig[microserviceIdentifier];

      for (let resourceName in microservice.resources) {
        if (!microservice.resources.hasOwnProperty(resourceName)) {
          continue;
        }

        let resourceActions = microservice.resources[resourceName];

        for (let actionName in resourceActions) {
          if (!resourceActions.hasOwnProperty(actionName)) {
            continue;
          }

          let action = resourceActions[actionName];
          action.methods.unshift('OPTIONS'); // adding OPTIONS method for CORS

          let resourceApiPath = APIGatewayService.pathify(microserviceIdentifier, resourceName, actionName);
          integrationParams[resourceApiPath] = {};

          switch (action.type) {
            case Action.LAMBDA:
              let uri = this._composeLambdaIntegrationUri(
                microservice.lambdas[action.identifier].arn
              );

              action.methods.forEach((httpMethod) => {
                integrationParams[resourceApiPath][httpMethod] = this._getIntegrationTypeParams(
                  'AWS', httpMethod, uri, action.api, action.cacheEnabled
                );
              });

              break;
            case Action.EXTERNAL:
              action.methods.forEach((httpMethod) => {
                integrationParams[resourceApiPath][httpMethod] = this._getIntegrationTypeParams(
                  'HTTP',
                  httpMethod,
                  action.source,
                  action.api,
                  action.cacheEnabled
                );
              });

              break;
            default:
              throw new Exception(
                `Unknown action type "${action.type}". Allowed types "${Action.TYPES.join(', ')}"`
              );
          }
        }
      }
    }

    return integrationParams;
  }

  /**
   * @param {String} type (AWS or HTTP)
   * @param {String} httpMethod
   * @param {String} uri
   * @param {*} apiConfig
   * @param {Boolean} enableCache
   * @returns {Object}
   * @private
   */
  _getIntegrationTypeParams(type, httpMethod, uri, apiConfig, enableCache = false) {
    let params = {
      type: 'MOCK',
      requestTemplates: this.getJsonRequestTemplate(httpMethod, type),
      authorizationType: Action.AUTH_TYPE_NONE,
      apiKeyRequired: false,
    };

    if (httpMethod !== 'OPTIONS') {
      params.type = type;
      params.integrationHttpMethod = (type === 'AWS') ? 'POST' : httpMethod;
      params.uri = uri;
      params.authorizationType = apiConfig.authorization;
      params.apiKeyRequired = apiConfig.keyRequired;
    }

    if (enableCache && httpMethod === 'GET') {
      params.cacheKeyParameters = [
        'caller.aws.principal',
        APIGatewayService.DEEP_CACHE_QS_PARAM,
      ];
    }

    return params;
  }

  /**
   * @note - do ask AWS devs what is this, an arn or smth else
   *
   * @example arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-2:389617777922:function:DeepDevSampleSayHelloa24bd154/invocations
   *
   * @param {String} lambdaArn
   * @returns {String}
   * @private
   */
  _composeLambdaIntegrationUri(lambdaArn) {
    let lambdaApiVersion = this.getApiVersions('Lambda').pop();
    let resourceDescriptor = `path/${lambdaApiVersion}/functions/${lambdaArn}/invocations`;

    let lambdaResource = Core.AWS.IAM.Factory.create('resource');
    lambdaResource.updateFromArn(lambdaArn);

    return `arn:aws:${Core.AWS.Service.API_GATEWAY}:${lambdaResource.region}:lambda:${resourceDescriptor}`;
  }

  /**
   * @param {String} apiId
   * @param {String} region
   * @param {String} stageName
   * @returns {String}
   * @private
   */
  _generateApiBaseUrl(apiId, region, stageName) {
    return `https://${apiId}.${Core.AWS.Service.API_GATEWAY_EXECUTE}.${region}.amazonaws.com/${stageName}`;
  }

  /**
   * @param {String} apiId
   * @param {String} stageName
   * @returns {String}
   * @private
   */
  _generateApiLogGroupName(apiId, stageName) {
    return `API-Gateway-Execution-Logs_${apiId}/${stageName}`;
  }

  /**
   * @param {String} httpMethod
   *
   * @returns {Object}
   */
  getJsonResponseTemplate(httpMethod) {
    let tplVal = ''; // enables Output passthrough

    if (httpMethod === 'OPTIONS') {
      tplVal = this.templateForMockIntegration;
    }

    return {
      'application/json': tplVal,
    };
  }

  /**
   * @param {String} httpMethod
   * @param {String|null} type
   * @returns {Object}
   */
  getJsonRequestTemplate(httpMethod, type = null) {
    let tplVal = ''; // enables Input passthrough

    if (type === 'AWS' && ['GET', 'DELETE'].indexOf(httpMethod) !== -1) {
      tplVal = this.qsToMapObjectMappingTpl;
    } else if (httpMethod === 'OPTIONS') {
      tplVal = this.templateForMockIntegration;
    }

    return {
      'application/json': tplVal,
    };
  }

  /**
   * Velocity template to transform query string params to a map object that is passed via POST to a lambda function
   *
   * @returns {String}
   */
  get qsToMapObjectMappingTpl() {
    return '#set($keys = []) #foreach($key in $input.params().querystring.keySet()) #if ($key != "_deepQsHash") ' +
      '#set($result = $keys.add($key)) #end #end { #foreach($key in $keys) ' +
      '"$key": "$util.escapeJavaScript($input.params($key))" #if($foreach.hasNext),#end #end }';
  }

  /**
   * @returns {string}
   */
  get templateForMockIntegration() {
    return '{"statusCode": 200}';
  }

  /**
   * @returns {Object}
   */
  get jsonEmptyModel() {
    return {
      'application/json': 'Empty',
    };
  }

  /**
   * @param {String} resourceMethod
   * @returns {Array}
   */
  methodStatusCodes(resourceMethod) {
    return resourceMethod === 'OPTIONS' ? [200] : Core.HTTP.Helper.CODES;
  }

  /**
   * @returns {Array}
   */
  get deepStatusCodeKey() {
    return Core.Exception.Exception.CODE_KEY;
  }

  /**
   * @param {String} httpMethod
   * @param {Array|null} resourceMethods
   * @returns {Object}
   */
  _getMethodResponseParameters(httpMethod, resourceMethods = null) {
    return this._getMethodCorsHeaders('method.response.header', httpMethod, resourceMethods);
  }

  /**
   * @param {String} httpMethod
   * @param {Object} integrationParams
   * @returns {Object}
   */
  _getMethodRequestParameters(httpMethod, integrationParams) {
    let params = this._getMethodCorsHeaders('method.request.header', httpMethod);

    if (integrationParams.hasOwnProperty('cacheKeyParameters') &&
      integrationParams.cacheKeyParameters.indexOf(APIGatewayService.DEEP_CACHE_QS_PARAM) !== -1) {
      params[APIGatewayService.DEEP_CACHE_QS_PARAM] = true;
    }

    return params;
  }

  /**
   * @param {String} prefix
   * @param {String} httpMethod
   * @param {Array|null} resourceMethods
   * @returns {Object}
   */
  _getMethodCorsHeaders(prefix, httpMethod, resourceMethods = null) {
    let headers = {};

    headers[`${prefix}.Access-Control-Allow-Origin`] = resourceMethods ? '\'*\'' : true;

    if (httpMethod === 'OPTIONS') {
      headers[`${prefix}.Access-Control-Allow-Headers`] = resourceMethods ?
        `'${APIGatewayService.ALLOWED_CORS_HEADERS.join(',')}'` : true;

      headers[`${prefix}.Access-Control-Allow-Methods`] = resourceMethods ?
        `'${resourceMethods.join(',')}'` : true;
    } else {
      headers[`${prefix}.Access-Control-Expose-Headers`] = resourceMethods ?
        `'${APIGatewayService.ALLOWED_EXPOSED_HEADERS.join(',')}'` : true;

      headers[`${prefix}.${APIGatewayService.ORIGINAL_REQUEST_ID_HEADER}`] = resourceMethods ?
        'integration.response.header.x-amzn-RequestId' : true;
    }

    return headers;
  }

  /**
   * Collect all endpoints arn from deployed resources
   *
   * @returns {Array}
   */
  getAllEndpointsArn() {
    let apiId = this._config.api.id;
    let apiRegion = this.apiGatewayClient.config.region;
    let arns = [];

    // @todo - waiting for http://docs.aws.amazon.com/apigateway/latest/developerguide/permissions.html to allow access to specific api resources
    //let resourcesPaths = this._config.api.hasOwnProperty('resources') ? Object.keys(this._config.api.resources) : [];
    //
    //resourcesPaths.forEach((resourcePath) => {
    //  // add only resource action (e.g. /hello-world-example/sample/say-hello)
    //  if (resourcePath.split('/').length >= 4) {
    //    arns.push(`arn:aws:${Core.AWS.Service.API_GATEWAY_EXECUTE}:${apiRegion}:${this.awsAccountId}:${apiId}/${this.stageName}/${resourcePath}`);
    //  }
    //});

    arns.push(`arn:aws:${Core.AWS.Service.API_GATEWAY_EXECUTE}:${apiRegion}:${this.awsAccountId}:${apiId}/*`);

    return arns;
  }

  /**
   * Allow Cognito users to invoke these endpoints
   *
   * @param {Object} endpointsARNs
   * @returns {Core.AWS.IAM.Statement}
   */
  static generateAllowInvokeMethodStatement(endpointsARNs) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();
    statement.action.add(Core.AWS.Service.API_GATEWAY_EXECUTE, 'Invoke');

    for (let endpointArnKey in endpointsARNs) {
      if (!endpointsARNs.hasOwnProperty(endpointArnKey)) {
        continue;
      }

      let endpointArn = endpointsARNs[endpointArnKey];
      statement.resource.add().updateFromArn(endpointArn);
    }

    return statement;
  }

  /**
   * @param {Array.<String>} paths
   * @param {String} restApiId
   * @param {Function} callback
   */
  _createApiResources(paths, restApiId, callback) {
    this._findApiResourceByPath('/', restApiId, (rootResource) => {
      this._createApiResourcesByPaths(paths, restApiId, rootResource, callback);
    });
  }

  /**
   * @param {String} restApiId
   * @param {Object} resources
   * @param {Function} callback
   * @private
   */
  _removeOldResources(restApiId, resources, callback) {
    let firstLevelResources = this._getFirstLevelResources(resources);
    let removedResources = 0;

    firstLevelResources.forEach((resource) => {
      let params = {
        resourceId: resource.id,
        restApiId: restApiId,
      };

      this.apiGatewayClient.deleteResource(params, (error, data) => {
        if (error) {
          throw new FailedToDeleteApiResourceException(resource.path, error);
        }

        removedResources++;

        if (removedResources === firstLevelResources.length) {
          callback();
        }
      });
    });
  }

  /**
   * @param {Object} resources
   * @returns {Array}
   * @private
   */
  _getFirstLevelResources(resources) {
    let rootResource = resources['/'];

    let firstLevelResources = [];
    for (let resourcePath in resources) {
      if (!resources.hasOwnProperty(resourcePath)) {
        continue;
      }

      let resource = resources[resourcePath];

      if (resource.parentId === rootResource.id) {
        firstLevelResources.push(resource);
      }
    }

    return firstLevelResources;
  }

  /**
   * @param {Array.<String>} paths
   * @param {String} restApiId
   * @param {Resource} rootResource
   * @param {Function} callback
   */
  _createApiResourcesByPaths(paths, restApiId, rootResource, callback) {
    if (paths.length <= 0) {
      callback(this._apiResources);
      return;
    }

    let pathParts = paths[0].split('/').slice(1);

    this._createApiChildResources(rootResource, pathParts, restApiId, (resources) => {
      this._createApiResourcesByPaths(paths.slice(1), restApiId, rootResource, callback);
    });
  }

  /**
   * @param {Resource} parentResource
   * @param {Array.<String>} pathParts
   * @param {String} restApiId
   * @param {Function} callback
   */
  _createApiChildResources(parentResource, pathParts, restApiId, callback) {
    if (pathParts.length <= 0) {
      callback(this._apiResources);
      return;
    }

    let path = nodePath.join(parentResource.path, pathParts[0]);

    this._findApiResourceByPath(path, restApiId, (resource) => {
      if (resource) {
        this._createApiChildResources(resource, pathParts.slice(1), restApiId, callback);
      } else {
        let retries = 0;
        let params = {
          parentId: parentResource.id,
          pathPart: pathParts[0],
          restApiId: restApiId,
        };

        var createResourceFunc = () => {
          this.apiGatewayClient.createResource(params, (error, resource) => {
            if (error) {
              retries++;
              if (retries > APIGatewayService.MAX_RETRIES) {
                throw new FailedToCreateApiResourceException(params.pathPart, error);
              }

              // Retry request in case it fails (e.g. TooManyRequestsException)
              setTimeout(createResourceFunc, APIGatewayService.RETRY_INTERVAL * retries);
            } else {
              this._apiResources[resource.path] = resource;
              this._createApiChildResources(resource, pathParts.slice(1), restApiId, callback);
            }
          });
        };

        createResourceFunc();
      }
    });
  }

  /**
   * @param {String} path
   * @param {String} restApiId
   * @param {Function} callback
   */
  _findApiResourceByPath(path, restApiId, callback) {
    let matchedResource = this._apiResources.hasOwnProperty(path) ? this._apiResources[path] : null;

    if (matchedResource) {
      callback(matchedResource);
      return;
    }

    let retries = 0;
    let params = {
      restApiId: restApiId,
      limit: APIGatewayService.PAGE_LIMIT,
    };

    var getResourcesFunc = () => {
      // fetches mainly root resource that is automatically created along with restApi
      this.apiGatewayClient.getResources(params, (error, data) => {
        if (error) {
          retries++;
          if (retries > APIGatewayService.MAX_RETRIES) {
            throw new FailedToListApiResourcesException(restApiId, error);
          }

          // Retry request in case it fails (e.g. TooManyRequestsException)
          setTimeout(getResourcesFunc, APIGatewayService.RETRY_INTERVAL * retries);
        } else {
          data.items.forEach((resource) => {
            this._apiResources[resource.path] = resource;
          });

          if (this._apiResources.hasOwnProperty(path)) {
            matchedResource = this._apiResources[path];
          }

          callback(matchedResource);
        }
      });
    };

    getResourcesFunc();
  }

  /**
   * @param {String[]} actions
   * @returns {Object}
   */
  manageApiGenerateAllowActionsStatement(actions = ['OPTIONS', 'HEAD', 'GET']) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    actions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.API_GATEWAY, actionName);
    });

    statement.resource.add(
      Core.AWS.Service.API_GATEWAY,
      this.apiGatewayClient.config.region,
      this.awsAccountId,
      `restapis/${this._config.api.id}/stages/${this.stageName}`
    );

    return statement;
  }
}
