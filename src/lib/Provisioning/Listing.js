/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {WaitFor} from '../Helpers/WaitFor';

export class Listing {
  /**
   * @param {Property|Object} property
   */
  constructor(property) {
    this._property = property;
    this._hash = property.configObj.baseHash;
  }

  /**
   * @param {Function} callback
   * @param {String[]} services
   * @param {String[]} regions
   * @returns {Listing}
   */
  list(callback, services = Listing.SERVICES, regions = Listing.REGIONS) {
    let wait = new WaitFor();
    let result = {
      matchedResources: 0,
      resources: {},
      errors: {},
    };
    // @todo: count regions as well
    let servicesRemaining = services.length;

    wait.push(() => {
      return servicesRemaining <= 0;
    });

    for (let i in regions) {
      if (!regions.hasOwnProperty(i)) {
        continue;
      }

      let region = regions[i];

      for (let i in services) {
        if (!services.hasOwnProperty(i)) {
          continue;
        }

        let serviceName = services[i];
        let service = this._createAwsService(serviceName, region);
        let ServiceListerProto = require(`./ListingDriver/${serviceName}Driver`)[`${serviceName}Driver`];

        let serviceLister = new ServiceListerProto(service, this._hash, this.deployCfg);

        serviceLister.list((error) => {
          servicesRemaining--;

          // @todo: split result by region
          if (error) {
            result.errors[serviceName] = error;
          } else {
            result.resources[serviceName] = serviceLister.extractResetStack;
            result.matchedResources += Object.keys(result.resources[serviceName]).length;
          }
        });
      }
    }

    wait.ready(() => {
      callback(result);
    });

    return this;
  }

  /**
   * @returns {Property|Object}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Object|null}
   */
  get deployCfg() {
    return this._property.config.provisioning || null;
  }

  /**
   * @returns {String|RegExp|Function}
   */
  get hash() {
    return this._hash;
  }

  /**
   * @param {String|RegExp|Function} hash
   */
  set hash(hash) {
    this._hash = hash;
  }

  /**
   * @param {String} name
   * @param {String} region
   * @returns {AbstractService|*}
   */
  _createAwsService(name, region) {
    let service = this._property.provisioning.getAwsServiceByName(name);

    service.config.region = region;

    return service;
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return [
      'APIGateway', 'APIGatewayPlan', 'APIGatewayKey', 'IAM', 'CognitoIdentity',
      'Lambda', 'CloudFront', 'DynamoDB', 'S3',
      'CloudWatchLogs', 'SQS', 'ElastiCache',
      'ES', 'CloudWatchEvents', 'CognitoIdentityProvider',
    ];
  }

  /**
   * @returns {Array}
   */
  static get REGIONS() {
    let regions = Core.AWS.Region.all();

    let allIndex = regions.indexOf('*');

    // removing * - all regions
    if (allIndex > -1) {
      regions.splice(allIndex, 1);
    }

    return regions;
  }
}
