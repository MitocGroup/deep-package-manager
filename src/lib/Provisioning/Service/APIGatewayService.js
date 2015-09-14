/**
 * Created by mgoria on 9/11/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {FailedToCreateApiGatewayException} from './Exception/FailedToCreateApiGatewayException';
import {FailedToCreateApiResourcesException} from './Exception/FailedToCreateApiResourcesException';

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
      name: `${this.propertyIdentifier}.api`,
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
    this._createApi(
      this.apiMetadata
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
    this._ready = true;

    return this;
  }

  /**
   * @param {Object} metadata
   * @returns {function}
   * @private
   */
  _createApi(metadata) {
    let restApi = null;
    let restResources = null;
    let apiGateway = this.provisioning.apiGateway;
    let wait = new WaitFor();

    apiGateway.createRestapi(metadata).then(function(api) {
      restApi = api.source;
    }, function(error) {

      if (error) {
        throw new FailedToCreateApiGatewayException(metadata.name, error);
      }
    });

    wait.push(function() {
      return restApi !== null;
    }.bind(this));

    return function(callback) {
      return wait.ready(function() {
        let innerWait = new WaitFor();

        let paths = [
          'user',
          'user/create',
          'user/retrieve',
          'account',
          'account/create',
        ];

        apiGateway.createResources(paths, restApi.id).then(function(resources) {
          restResources = resources;
        }, function(error) {

          if (error) {
            throw new FailedToCreateApiResourcesException(paths, error);
          }
        });

        innerWait.push(function() {
          return restResources !== null;
        }.bind(this));

        innerWait.ready(function() {
          callback(restApi, restResources);
        });
      }.bind(this));
    }.bind(this);
  }
}
