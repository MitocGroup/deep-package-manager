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
import {FailedToPutApiGatewayIntegrationResponseException} from './Exception/FailedToPutApiGatewayIntegrationResponseException';
import {FailedToPutApiGatewayMethodResponseException} from './Exception/FailedToPutApiGatewayMethodResponseException';
import {FailedToCreateIamRoleException} from './Exception/FailedToCreateIamRoleException';
import {FailedAttachingPolicyToRoleException} from './Exception/FailedAttachingPolicyToRoleException';
import {Action} from '../../Microservice/Metadata/Action';
import {IAMService} from './IAMService';
import {LambdaService} from './LambdaService';

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
  static get API_NAME_PREFIX() {
    return 'Api';
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
      name: this.generateAwsResourceName(APIGatewayService.API_NAME_PREFIX, Core.AWS.Service.API_GATEWAY),
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
    this._provisionApiResources(
      this.apiMetadata,
      this._getResourcePaths(this.provisioning.property.microservices)
    )(function(api, resources, role) {
      this._config.api = {
        id: api.id,
        name: api.name,
        resources: resources,
        role: role,
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
    let integrationMetadata = this.getResourcesIntegrationMetadata(this.property.config.microservices);
    let lambdasArn = LambdaService.getAllLambdasArn(this.property.config.microservices);

    this._putApiIntegrations(
      this._config.api.id,
      this._config.api.resources,
      this._config.api.role,
      lambdasArn,
      integrationMetadata
    )(function(methods, integrations, rolePolicy) {
      this._config.postDeploy = {
        methods: methods,
        integrations: integrations,
        rolePolicy: rolePolicy,
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
  _provisionApiResources(metadata, resourcePaths) {
    var restApi = null;
    var restResourcesCreated = false;
    var restResources = null;
    var restApiIamRole = null;

    let waitLevel1 = new WaitFor();
    let waitLevel2 = new WaitFor();
    let waitLevel3 = new WaitFor();
    let waitLevel4 = new WaitFor();

    this._createApi(metadata, (api) => {
      restApi = api;
    });

    waitLevel1.push(() => {
      return restApi !== null;
    });

    return (callback) => {
      return waitLevel1.ready(() => {
        this._createApiResources(resourcePaths, restApi.id, (responseFlag) => {
          restResourcesCreated = responseFlag;
        });

        waitLevel2.push(() => {
          return restResourcesCreated;
        });

        return waitLevel2.ready(() => {
          this._listApiResources(restApi.id, (resources) => {
            restResources = resources;
          });

          waitLevel3.push(() => {
            return restResources !== null;
          });

          return waitLevel3.ready(() => {
            this._createApiIamRole((role) => {
              restApiIamRole = role;
            });

            waitLevel4.push(() => {
              return restApiIamRole !== null;
            });

            return waitLevel4.ready(() => {
              callback(restApi, this._extractApiResourcesMetadata(restResources), restApiIamRole);
            });
          });
        });
      });
    };
  }

  /**
   * @param {String} apiId
   * @param {Object} apiResources
   * @param {Object} integrationMetadata
   * @private
   */
  _putApiIntegrations(apiId, apiResources, apiRole, lambdasArn, integrationMetadata) {
    let _this = this;
    let apiGateway = this.provisioning.apiGateway;
    let iam = this.provisioning.iam;
    var waitLevel1 = new WaitFor();
    var waitLevel2 = new WaitFor();
    var waitLevel3 = new WaitFor();
    var waitLevel4 = new WaitFor();
    var waitLevel5 = new WaitFor();
    var methods = {};
    var integrations = {};
    var rolePolicy = null;
    var integrationParams = integrationMetadata.params;
    var stackSizeLevel1 = integrationMetadata.count;
    var stackSizeLevel2 = integrationMetadata.count;
    var stackSizeLevel3 = integrationMetadata.count;
    var stackSizeLevel4 = integrationMetadata.count;

    // @todo - move these functions as private class methods
    // @todo - move these steps (putHttpMethods, putApiMethodResponse) into _createApiResources method to do it on provision time
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
            requestModels: {
              'application/json': 'Empty',
            },
          };

          apiGateway.putMethod(params).then((method) => {
            stackSizeLevel1--;
            methods[resourcePath][resourceMethod] = method;
          }, (error) => {

            stackSizeLevel1--;
            if (error) {
              throw new FailedToPutApiGatewayMethodException(resourcePath, resourceMethod, error);
            }
          });
        }
      }
    }

    function putApiMethodResponse() {
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
            resourceId: apiResource.id,
            restapiId: apiId,
            statusCode: 200,
            responseModels: {
              'application/json': 'Empty',
            },
          };

          apiGateway.putMethodResponse(params).then(() => {
            stackSizeLevel2--;
          }, (error) => {

            stackSizeLevel2--;
            if (error) {
              throw new FailedToPutApiGatewayMethodResponseException(resourcePath, resourceMethod, error);
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

          //methodParams.credentials = apiRole.Arn; // allow APIGateway to invoke all provisioned lambdas
          methodParams.credentials = 'arn:aws:iam::*:user/*'; // @todo - find a smarter way to enable "Invoke with caller credentials" option

          apiGateway.putIntegration(methodParams).then((integration) => {
            stackSizeLevel3--;
            integrations[resourcePath][resourceMethod] = integration;
          }, (error) => {

            stackSizeLevel3--;
            if (error) {
              throw new FailedToPutApiGatewayIntegrationException(resourcePath, methodParams.uri, error);
            }
          });
        }
      }
    }

    function putApiIntegrationResponses() {
      for (let resourcePath in integrationParams) {
        if (!integrationParams.hasOwnProperty(resourcePath)) {
          continue;
        }

        let resourceMethods = integrationParams[resourcePath];
        let apiResource = apiResources[resourcePath];

        for (let resourceMethod in resourceMethods) {
          if (!resourceMethods.hasOwnProperty(resourceMethod)) {
            continue;
          }

          let params = {
            httpMethod: resourceMethod,
            resourceId: apiResource.id,
            restapiId: apiId,
            statusCode: 200,
            responseTemplates: {
              'application/json': '',
            },
          };

          apiGateway.putIntegrationResponse(params).then(() => {
            stackSizeLevel4--;
          }, (error) => {

            stackSizeLevel4--;
            if (error) {
              throw new FailedToPutApiGatewayIntegrationResponseException(resourcePath, error);
            }
          });
        }
      }
    }

    function addPolicyToApiRole() {
      let policy = LambdaService.generateAllowInvokeFunctionPolicy(lambdasArn);

      let params = {
        PolicyDocument: policy.toString(),
        PolicyName: _this.generateAwsResourceName(
          `${APIGatewayService.API_NAME_PREFIX}InvokeLambdaPolicy`,
          Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT
        ),
        RoleName: apiRole.RoleName,
      };

      iam.putRolePolicy(params, (error, data) => {
        if (error) {
          throw new FailedAttachingPolicyToRoleException(params.PolicyName, params.RoleName, error);
        }

        rolePolicy = params.PolicyDocument;
      });
    }

    putHttpMethods();

    waitLevel1.push(() => {
      return stackSizeLevel1 === 0;
    });

    return (callback) => {
      return waitLevel1.ready(() => {
        putApiMethodResponse();

        waitLevel2.push(() => {
          return stackSizeLevel2 === 0;
        });

        return waitLevel2.ready(() => {
          putIntegrations();

          waitLevel3.push(() => {
            return stackSizeLevel3 === 0;
          });

          return waitLevel3.ready(() => {
            putApiIntegrationResponses();

            waitLevel4.push(() => {
              return stackSizeLevel4 === 0;
            });

            return waitLevel4.ready(() => {
              addPolicyToApiRole();

              waitLevel5.push(() => {
                return rolePolicy !== null;
              });

              return waitLevel5.ready(() => {
                callback(methods, integrations, rolePolicy);
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
    let apiGateway = this.provisioning.apiGateway;

    apiGateway.createRestapi(metadata).then((api) => {
      callback(api.source);
    }, (error) => {

      if (error) {
        throw new FailedToCreateApiGatewayException(metadata.name, error);
      }
    });
  }

  /**
   * @param {Array} resourcePaths
   * @param {String} restApiId
   * @param {Function} callback
   */
  _createApiResources(resourcePaths, restApiId, callback) {
    let apiGateway = this.provisioning.apiGateway;
    let params = {
      paths: resourcePaths,
      restapiId: restApiId,
    };

    apiGateway.createResources(params).then(() => {
      callback(true);
    }, (error) => {

      if (error) {
        throw new FailedToCreateApiResourcesException(resourcePaths, error);
      }
    });
  }

  /**
   * @param {String} restApiId
   * @param {Function} callback
   */
  _listApiResources(restApiId, callback) {
    let apiGateway = this.provisioning.apiGateway;

    apiGateway.listResources({restapiId: restApiId}).then((resources) => {
      callback(resources);
    }, (error) => {

      if (error) {
        throw new FailedToListApiResourcesException(restApiId, error);
      }
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
  };

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
  getResourcesIntegrationMetadata(microservicesConfig) {
    let integrationsCount = 0;
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
                  requestTemplates: this.requestTemplates,
                };

                integrationsCount++;
              }

              break;
            case Action.EXTERNAL:
              for (httpMethod of action.methods) {
                integrationParams[resourceApiPath][httpMethod] = {
                  type: 'HTTP',
                  integrationHttpMethod: httpMethod,
                  uri: action.source,
                  requestTemplates: this.requestTemplates,
                };

                integrationsCount++;
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

    return {
      count: integrationsCount,
      params: integrationParams,
    };
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

  /**
   * @returns {Object}
   */
  get requestTemplates() {
    return {
      'application/json': '',
    };
  }
}