/**
 * Created by mgoria on 9/11/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {Exception} from '../../Exception/Exception';
import {FailedToCreateApiGatewayException} from './Exception/FailedToCreateApiGatewayException';
import {FailedToCreateApiResourcesException} from './Exception/FailedToCreateApiResourcesException';
import {FailedToListApiResourcesException} from './Exception/FailedToListApiResourcesException';
import {FailedToPutApiGatewayIntegrationException} from './Exception/FailedToPutApiGatewayIntegrationException';
import {FailedToPutApiGatewayMethodException} from './Exception/FailedToPutApiGatewayMethodException';
import {Action} from '../../Microservice/Metadata/Action';

/**
 * APIGateway service
 */
export class APIGatewayService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.API_GATEWAY;
  }

  /**
   * API default metadata
   *
   * @returns {Object}
   */
  get apiMetadata() {
    return {
      name: this.generateAwsResourceName('Api', Core.AWS.Service.API_GATEWAY),
    };
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
   */
  _setup(services) {
    this._createApiResources(
      this.apiMetadata,
      this._getResourcePaths(this.provisioning.property.microservices)
    )(function(api, resources) {
      this._config.api = {
        id: api.id,
        name: api.name,
        resources: resources,
      };
      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   */
  _postProvision(services) {
    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {APIGatewayService}
   */
  _postDeployProvision(services) {
    let integrationParams = this._getResourcesIntegrationParams(this.property.config.microservices);

    this._putApiIntegrations(
      this._config.api.id,
      this._config.api.resources,
      integrationParams
    )(function(methods, integrations) {
      this._config.postDeploy = {
        methods: methods,
        integrations: integrations,
      };
      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @param {Object} metadata
   * @param {Array} resourcePaths
   * @returns {function}
   * @private
   */
  _createApiResources(metadata, resourcePaths) {
    var restApi = null;
    var restResourcesCreated = false;
    var restResources = null;
    let apiGateway = this.provisioning.apiGateway;
    let wait = new WaitFor();

    apiGateway.createRestapi(metadata).then((api) => {
      restApi = api.source;
    }, (error) => {

      if (error) {
        throw new FailedToCreateApiGatewayException(metadata.name, error);
      }
    });

    wait.push(() => {
      return restApi !== null;
    });

    return (callback) => {
      return wait.ready(() => {
        let secondLevelWait = new WaitFor();

        let params = {
          paths: resourcePaths,
          restapiId: restApi.id,
        };

        apiGateway.createResources(params).then(() => {
          restResourcesCreated = true;
        }, (error) => {

          if (error) {
            throw new FailedToCreateApiResourcesException(resourcePaths, error);
          }
        });

        secondLevelWait.push(() => {
          return restResourcesCreated;
        });

        return secondLevelWait.ready(() => {
          let thirdLevelWait = new WaitFor();

          apiGateway.listResources({restapiId: restApi.id}).then((resources) => {
            restResources = resources;
          }, (error) => {

            if (error) {
              throw new FailedToListApiResourcesException(restApi.id, error);
            }
          });

          thirdLevelWait.push(() => {
            return restResources !== null;
          });

          return thirdLevelWait.ready(() => {
            callback(restApi, this._extractApiResourcesMetadata(restResources));
          });
        });
      });
    };
  }

  /**
   * @param {String} apiId
   * @param {Object} apiResources
   * @param {Object} integrationParams
   * @private
   */
  _putApiIntegrations(apiId, apiResources, integrationParams) {
    let apiGateway = this.provisioning.apiGateway;
    var waitLevel1 = new WaitFor();
    var waitLevel2 = new WaitFor();
    var methods = {};
    var integrations = {};
    var stackSizeLevel1 = Object.keys(integrationParams).length; // @todo: count deep resource http methods
    var stackSizeLevel2 = stackSizeLevel1;

    // @todo - move these functions as private class methods
    function putHttpMethods() {
      for (let resourcePath in integrationParams) {
        if (!integrationParams.hasOwnProperty(resourcePath)) {
          continue;
        }

        let resourceMethods = integrationParams[resourcePath];
        let apiResource = apiResources[resourcePath];
        methods[resourcePath] = {};

        for (let resourceMethod in resourceMethods) {
          if (!resourceMethods.hasOwnProperty(resourceMethod)) {
            continue;
          }

          let params = {
            httpMethod: resourceMethod,
            authorizationType: 'AWS_IAM',
            resourceId: apiResource.id,
            restapiId: apiId,
          };

          apiGateway.putMethod(params).then((method) => {
            stackSizeLevel1--;
            methods[resourcePath][resourceMethod] = method;
          }, (error) => {

            stackSizeLevel1--;
            if (error) {
              throw new FailedToPutApiGatewayMethodException(resourcePath, methodParams.uri, error);
            }
          });
        }
      }
    }

    function putIntegrations() {
      for (let resourcePath in integrationParams) {
        if (!integrationParams.hasOwnProperty(resourcePath)) {
          continue;
        }

        let resourceMethods = integrationParams[resourcePath];
        let apiResource = apiResources[resourcePath];
        integrations[resourcePath] = {};

        for (let resourceMethod in resourceMethods) {
          if (!resourceMethods.hasOwnProperty(resourceMethod)) {
            continue;
          }

          let methodParams = resourceMethods[resourceMethod];
          methodParams.httpMethod = resourceMethod;
          methodParams.resourceId = apiResource.id;
          methodParams.restapiId = apiId;

          // @todo - create this role on ApiGateway service provision
          methodParams.credentials = 'arn:aws:iam::389617777922:role/ApiGatewayInvokeLambda'; // allow APIGateway to invoke lambdas

          apiGateway.putIntegration(methodParams).then((integration) => {
            stackSizeLevel2--;
            integrations[resourcePath][resourceMethod] = integration;
          }, (error) => {

            stackSizeLevel2--;
            if (error) {
              throw new FailedToPutApiGatewayIntegrationException(resourcePath, methodParams.uri, error);
            }
          });
        }
      }
    }

    putHttpMethods();

    waitLevel1.push(() => {
      return stackSizeLevel1 === 0;
    });

    return (callback) => {
      return waitLevel1.ready(() => {
        putIntegrations();
        waitLevel2.push(() => {
          return stackSizeLevel2 === 0;
        });

        return waitLevel2.ready(() => {
          callback(methods, integrations);
        });
      });
    };
  }

  /**
   * All resources to be created in API Gateway
   *
   * microservice_identifier
   *    resource_name
   *        action_name
   *
   * @param {Object} microservices
   * @returns {Array}
   * @private
   */
  _getResourcePaths(microservices) {
    let resourcePaths = [];

    for (let microserviceKey in microservices) {
      if (!microservices.hasOwnProperty(microserviceKey)) {
        continue;
      }

      let microservice = microservices[microserviceKey];

      resourcePaths.push(this._pathfy(microservice.identifier));

      for (let actionKey in microservice.resources.actions) {
        if (!microservice.resources.actions.hasOwnProperty(actionKey)) {
          continue;
        }

        let action = microservice.resources.actions[actionKey];
        let resourcePath = this._pathfy(microservice.identifier, action.resourceName);

        // push actions parent resource only once
        if (resourcePaths.indexOf(resourcePath) === -1) {
          resourcePaths.push(resourcePath);
        }

        resourcePaths.push(
          this._pathfy(microservice.identifier, action.resourceName, action.name)
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
   * @private
   */
  _pathfy(microserviceIdentifier, resourceName = '', actionName = '') {
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

      let rawResource = rawResources[rawResourceKey].source;

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
  _getResourcesIntegrationParams(microservicesConfig) {
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
          let resourceApiPath = this._pathfy(microserviceIdentifier, resourceName, actionName);
          integrationParams[resourceApiPath] = {};
          var httpMethod = null;

          switch (action.type) {
            case Action.LAMBDA:
              let uri = this._composeLambdaIntegrationUri(
                microservice.lambdas[action.identifier],
                microservice.deployedServices.lambdas[action.identifier]
              );

              for (httpMethod of action.methods) {
                integrationParams[resourceApiPath][httpMethod] = {
                  type: 'AWS',
                  integrationHttpMethod: 'POST',
                  uri: uri,
                };
              }

              break;
            case Action.EXTERNAL:
              for (httpMethod of action.methods) {
                integrationParams[resourceApiPath][httpMethod] = {
                  type: 'HTTP',
                  integrationHttpMethod: httpMethod,
                  uri: action.source,
                };
              }

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
   * @note - do ask AWS devs what is this, an arn or smth else
   *
   * @example arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-west-2:389617777922:function:DeepDevSampleSayHelloa24bd154/invocations
   *
   * @param {Object} builtLambdaConfig
   * @param {Object} deployedLambdaConfig
   * @returns {String}
   * @private
   */
  _composeLambdaIntegrationUri(builtLambdaConfig, deployedLambdaConfig) {
    let lambdaArn = deployedLambdaConfig.FunctionArn;
    let lambdaApiVersion = this.getApiVersions('Lambda').pop();
    let resourceDescriptor = `path/${lambdaApiVersion}/functions/${lambdaArn}/invocations`;

    let awsResource = Core.AWS.IAM.Factory.create('resource');
    awsResource.service = Core.AWS.Service.API_GATEWAY;
    awsResource.region = builtLambdaConfig.region;
    awsResource.accountId = 'lambda';
    awsResource.descriptor = resourceDescriptor;

    return awsResource.extract();
  }
}