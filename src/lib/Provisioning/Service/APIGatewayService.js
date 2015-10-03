/**
 * Created by mgoria on 9/11/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {FailedToCreateApiGatewayException} from './Exception/FailedToCreateApiGatewayException';
import {FailedToCreateApiResourcesException} from './Exception/FailedToCreateApiResourcesException';
import {FailedToListApiResourcesException} from './Exception/FailedToListApiResourcesException';

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
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

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
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

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

    apiGateway.createRestapi(metadata).then(function(api) {
      restApi = api.source;
    }, function(error) {

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

        apiGateway.createResources(params).then(function() {
          restResourcesCreated = true;
        }, function(error) {

          if (error) {
            throw new FailedToCreateApiResourcesException(paths, error);
          }
        });

        secondLevelWait.push(function() {
          return restResourcesCreated;
        }.bind(this));

        return secondLevelWait.ready(() => {
          let thirdLevelWait = new WaitFor();

          apiGateway.listResources({restapiId: restApi.id}).then(function(resources) {
            restResources = resources;
          }, function(error) {

            if (error) {
              throw new FailedToListApiResourcesException(restApi.id, error);
            }
          });

          thirdLevelWait.push(function() {
            return restResources !== null;
          }.bind(this));

          return thirdLevelWait.ready(() => {
            callback(restApi, this._extractResourcesMetadata(restResources));
          });
        });
      });
    };
  }

  /**
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
  _extractResourcesMetadata(rawResources) {
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
}