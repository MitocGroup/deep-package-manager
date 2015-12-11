/**
 * Created by mgoria on 9/11/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateApiGatewayException} from './Exception/FailedToCreateApiGatewayException';
import {FailedToCreateApiResourceException} from './Exception/FailedToCreateApiResourceException';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {FailedToDeployApiGatewayException} from './Exception/FailedToDeployApiGatewayException';
import {FailedToExecuteApiGatewayMethodException} from './Exception/FailedToExecuteApiGatewayMethodException';
import {FailedToListApiResourcesException} from './Exception/FailedToListApiResourcesException';
import {Action} from '../../Microservice/Metadata/Action';
import {IAMService} from './IAMService';
import {LambdaService} from './LambdaService';
import Utils from 'util';
import objectMerge from 'object-merge';
import nodePath from 'path';

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
    this._newApiResources = {};
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
   * @returns {String}
   */
  static get ALLOWED_CORS_HEADERS() {
    return "'Content-Type,X-Amz-Date,X-Amz-Security-Token,Authorization'";
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
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   *
   * @todo: remove config.api key and put object to the root
   */
  _setup(services) {
    let resourcePaths = this._getResourcePaths(this.provisioning.property.microservices);

    this._provisionApiResources(
      this.apiMetadata,
      resourcePaths
    )((api, resources, role) => {
      this._newApiResources = resources;

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
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
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
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   */
  _postDeployProvision(services) {
    let integrationParams = this.getResourcesIntegrationParams(this.property.config.microservices);

    this._putApiIntegrations(
      this._config.api.id,
      this._newApiResources,
      this._config.api.role,
      integrationParams
    )((methods, integrations, rolePolicy, deployedApi) => {
      this._config.api.methods = methods;
      this._config.api.integrations = integrations;
      this._config.api.rolePolicy = rolePolicy;
      this._config.api.deployedApi = deployedApi;

      this._ready = true;
    });

    return this;
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
                  callback(methods, integrations, rolePolicy, deployedApi);
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
      `${APIGatewayService.API_NAME_PREFIX}InvokeLambda`,
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
    let wait = new WaitFor();

    let methodsParams = this._methodParamsGenerator(method, apiId, apiResources, integrationParams);
    let stackSize = methodsParams.length;
    let dataStack = {};
    let delay = 0;

    for (let key in methodsParams) {
      if (!methodsParams.hasOwnProperty(key)) {
        continue;
      }

      let params = methodsParams[key];
      let resourcePath = params.resourcePath;
      delete params.resourcePath;

      setTimeout(() => {
        dataStack[resourcePath] = {};

        this.apiGatewayClient[method](params, (error, data) => {
          if (error) {
            throw new FailedToExecuteApiGatewayMethodException(method, resourcePath, params.httpMethod, error);
          }

          dataStack[resourcePath][params.httpMethod] = data;
          stackSize--;
        });
      }, delay);

      delay += 300; // ApiGateway api returns an 500 Internal server error when calls to the same endpoint are 'simultaneously'
    }

    wait.push(() => {
      return stackSize === 0;
    });

    wait.ready(() => {
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
   * @param {Object} apiRole
   * @param {Function} callback
   * @private
   */
  _addPolicyToApiRole(apiRole, callback) {
    let lambdaService = this.provisioning.services.find(LambdaService);

    let iam = this.provisioning.iam;
    let policy = new Core.AWS.IAM.Policy();
    policy.statement.add(lambdaService.generateAllowInvokeFunctionStatement());

    let params = {
      PolicyDocument: policy.toString(),
      PolicyName: this.generateAwsResourceName(
        `${APIGatewayService.API_NAME_PREFIX}InvokeLambdaPolicy`,
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
        let params = {};

        switch (method) {
          case 'putMethod':
            params = {
              authorizationType: resourceMethod === 'OPTIONS' ? 'NONE' : 'AWS_IAM',
              requestModels: this.jsonEmptyModel,
              requestParameters: this._getMethodRequestParameters(resourceMethod),
            };
            break;
          case 'putMethodResponse':
            params = {
              statusCode: '200',
              responseModels: this.jsonEmptyModel,
              responseParameters: this._getMethodResponseParameters(resourceMethod),
            };
            break;
          case 'putIntegration':
            params = resourceMethods[resourceMethod];

            //params.credentials = apiRole.Arn; // allow APIGateway to invoke all provisioned lambdas
            // @todo - find a smarter way to enable "Invoke with caller credentials" option
            params.credentials = resourceMethod === 'OPTIONS' ? null : 'arn:aws:iam::*:user/*';
            break;
          case 'putIntegrationResponse':
            params = {
              statusCode: '200',
              responseTemplates: this.getJsonResponseTemplate(resourceMethod),
              responseParameters: this._getMethodResponseParameters(resourceMethod, Object.keys(resourceMethods)),
            };
            break;
          default:
            throw new Exception(`Unknown api method ${method}.`);
        }

        paramsArr.push(Utils._extend(commonParams, params));
      }
    }

    return paramsArr;
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

      if (microservice.resources.actions.length > 0) {
        resourcePaths.push(APIGatewayService.pathify(microservice.identifier));
      }

      for (let actionKey in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = microservice.resources.actions[actionKey];
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
                integrationParams[resourceApiPath][httpMethod] = this._getIntegrationTypeParams('AWS', httpMethod, uri);
              });

              break;
            case Action.EXTERNAL:
              action.methods.forEach((httpMethod) => {
                integrationParams[resourceApiPath][httpMethod] = this._getIntegrationTypeParams(
                  'HTTP',
                  httpMethod,
                  action.source
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
   * @returns {Object}
   * @private
   */
  _getIntegrationTypeParams(type, httpMethod, uri) {
    let params = {
      type: 'MOCK',
      requestTemplates: this.getJsonRequestTemplate(httpMethod, type),
    };

    if (httpMethod !== 'OPTIONS') {
      params.type = type;
      params.integrationHttpMethod = (type === 'AWS') ? 'POST' : httpMethod;
      params.uri = uri;
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
    return '{ #foreach($key in $input.params().querystring.keySet()) "$key": "$util.escapeJavaScript($input.params($key))"#if($foreach.hasNext),#end #end }';
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
   * @param {String} httpMethod
   * @param {Array|null} resourceMethods
   * @returns {Object}
   */
  _getMethodResponseParameters(httpMethod, resourceMethods = null) {
    return this._getMethodCorsHeaders('method.response.header', httpMethod, resourceMethods);
  }

  /**
   * @param {String} httpMethod
   * @param {Array|null} resourceMethods
   * @returns {Object}
   */
  _getMethodRequestParameters(httpMethod, resourceMethods = null) {
    return this._getMethodCorsHeaders('method.request.header', httpMethod, resourceMethods);
  }

  /**
   * @param {String} prefix
   * @param {String} httpMethod
   * @param {Array|null} resourceMethods
   * @returns {Object}
   */
  _getMethodCorsHeaders(prefix, httpMethod, resourceMethods = null) {
    let headers = {};

    headers[`${prefix}.Access-Control-Allow-Origin`] = resourceMethods ? "'*'" : true;

    if (httpMethod === 'OPTIONS') {
      headers[`${prefix}.Access-Control-Allow-Headers`] = resourceMethods ? APIGatewayService.ALLOWED_CORS_HEADERS : true;
      headers[`${prefix}.Access-Control-Allow-Methods`] = resourceMethods ? `'${resourceMethods.join(',')}'` : true;
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
    let resourcesPaths = this._config.api.hasOwnProperty('resources') ? Object.keys(this._config.api.resources) : [];
    let arns = [];

    // @todo - waiting for http://docs.aws.amazon.com/apigateway/latest/developerguide/permissions.html to allow access to specific api resources
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

    firstLevelResources.forEach((resourceId) => {
      let params = {
        resourceId: resourceId,
        restApiId: restApiId,
      };

      this.apiGatewayClient.deleteResource(params, (error, data) => {
        if (error) {
          // @todo throw an Exception
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
        firstLevelResources.push(resource.id);
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
        let params = {
          parentId: parentResource.id,
          pathPart: pathParts[0],
          restApiId: restApiId,
        };

        this.apiGatewayClient.createResource(params, (error, resource) => {
          if (error) {
            throw new FailedToCreateApiResourceException(params.pathPart, error);
          }

          this._apiResources[resource.path] = resource;
          this._createApiChildResources(resource, pathParts.slice(1), restApiId, callback);
        });
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

    let params = {
      restApiId: restApiId,
      limit: APIGatewayService.PAGE_LIMIT,
    };

    // fetches mainly root resource that is automatically created along with restApi
    this.apiGatewayClient.getResources(params, (error, data) => {
      if (error) {
        throw new FailedToListApiResourcesException(restApiId, error);
      }

      data.items.forEach((resource) => {
        this._apiResources[resource.path] = resource;
      });

      if (this._apiResources.hasOwnProperty(path)) {
        matchedResource = this._apiResources[path];
      }

      callback(matchedResource);
    });
  }
}
