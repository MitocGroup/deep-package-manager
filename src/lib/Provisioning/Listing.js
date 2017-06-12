/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {WaitFor} from '../Helpers/WaitFor';
import objectMerge from 'object-merge';

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
  listAll(callback, services = Listing.SERVICES, regions = Listing.REGIONS) {
    let wait = new WaitFor();
    let result = {};
    let totalRequests = regions.length * services.length;

    wait.push(() => {
      return totalRequests <= 0;
    });

    for (let i in regions) {
      if (!regions.hasOwnProperty(i)) {
        continue;
      }

      let region = regions[i];

      result[region] = {
        matchedResources: 0,
        apps: {},
        resources: {},
        errors: {},
      };

      for (let i in services) {
        if (!services.hasOwnProperty(i)) {
          continue;
        }

        let serviceName = services[i];

        let ServiceListerProto = require(`./ListingDriver/${serviceName}Driver`)[`${serviceName}Driver`];

        // skip listing services that are not supported by specific region
        if (!Listing.serviceSupportsRegion(ServiceListerProto, region)) {
          totalRequests--;
          continue;
        }

        let service = this._createAwsService(serviceName, region);
        let serviceLister = new ServiceListerProto(service, this._hash, this.deployCfg);

        serviceLister.list((error) => {
          totalRequests--;

          if (error) {
            result[region].errors[serviceName] = error;
          } else {
            let serviceAppResources = serviceLister.extractResetStack;

            result[region].resources[serviceName] = serviceAppResources;

            for (let appHash in serviceAppResources) {
              if (!serviceAppResources.hasOwnProperty(appHash)) {
                continue;
              }

              result[region].apps[appHash] = result[region].apps[appHash] || 0;

              // skip counting globally available services like IAM, S3, etc
              if (!Listing.isGlobalService(serviceName)) {
                result[region].apps[appHash]++;
              }

              result[region].matchedResources += Object.keys(serviceAppResources[appHash]).length;
            }
          }
        });
      }
    }

    wait.ready(() => {
      callback(this._filterResult(result));
    });

    return this;
  }

  /**
   * back-compatible shortcut for legacy implementations
   *
   * @param {Function} callback
   * @param {String[]} services
   * @returns {Listing}
   */
  list(callback, services = Listing.SERVICES) {
    let region = this._property.config.aws.region;

    return this.listAll(result => {
      if (result.hasOwnProperty(region)) {
        result = result[region];
      }

      callback(result);
    }, services, [region]);
  }

  /**
   * @param {*} result
   * @returns {boolean}
   */
  resultHasErrors(result) {
    // back-compatible for legacy implementations
    if (result.hasOwnProperty('errors')) {
      return Object.keys(result.errors).length > 0;
    }

    for (let region in result) {
      if (!result.hasOwnProperty(region)) {
        continue;
      }

      let regionResult = result[region];

      if (Object.keys(regionResult.errors).length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * @param {*} result
   * @returns {number}
   */
  resultMatchedResources(result) {
    // back-compatible for legacy implementations
    if (result.hasOwnProperty('matchedResources')) {
      return result.matchedResources;
    }

    let count = 0;

    for (let region in result) {
      if (!result.hasOwnProperty(region)) {
        continue;
      }

      count += result[region].matchedResources;
    }

    return count;
  }

  /**
   * @param {*} ServicePrototype
   * @param {String} region
   * @returns {Boolean}
   */
  static serviceSupportsRegion(ServicePrototype, region) {
    return ServicePrototype.AVAILABLE_REGIONS.indexOf(region) !== -1
      || ServicePrototype.AVAILABLE_REGIONS.indexOf(Core.AWS.Region.ANY) !== -1;
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

    // create a new service instance with different region
    return new service.constructor({
      region: region
    });
  }

  /**
   * @param {String} appHash
   * @param {*} result
   * @returns {Boolean}
   * @private
   */
  _appExistsInOtherRegion(appHash, result) {
    for (let region in result) {
      if (!result.hasOwnProperty(region)) {
        continue;
      }

      let regionApps = result[region].apps;

      if (regionApps.hasOwnProperty(appHash) && regionApps[appHash] > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Moves all "alone" global resources into global region to avoid duplications
   *
   * @param {*} result
   * @returns {*}
   * @private
   */
  _filterResult(result) {
    let globalRegion = {
      matchedResources: 0,
      apps: {},
      resources: {},
      errors: {},
    };

    let prevRegion = null;

    for (let region in result) {
      if (!result.hasOwnProperty(region)) {
        continue;
      }

      // cleanup regions without resources
      if (prevRegion && result[prevRegion].matchedResources === 0) {
        delete result[prevRegion];
      }

      prevRegion = region;

      let regionResources = result[region].resources;

      for (let service in regionResources) {
        if (!regionResources.hasOwnProperty(service)) {
          continue;
        }

        let serviceApps = regionResources[service];

        for (let appHash in serviceApps) {
          if (!serviceApps.hasOwnProperty(appHash) || result[region].apps[appHash] !== 0) {
            continue;
          }

          let matchedResources = Object.keys(serviceApps[appHash]).length;

          if (!this._appExistsInOtherRegion(appHash, result)) {
            globalRegion.apps[appHash] = result[region].apps[appHash];

            globalRegion.resources[service] = globalRegion.resources[service] || {};
            globalRegion.resources[service][appHash] = objectMerge(
              globalRegion.resources[service][appHash],
              serviceApps[appHash]
            );

            globalRegion.matchedResources += Object.keys(globalRegion.resources[service][appHash]).length;
          }

          result[region].matchedResources -= matchedResources;
          delete serviceApps[appHash];
        }
      }
    }

    if (prevRegion && result[prevRegion].matchedResources === 0) {
      delete result[prevRegion];
    }

    if (globalRegion.matchedResources > 0) {
      result[Listing.GLOBAL_REGION_KEY] = globalRegion;
    }

    return result || {};
  }

  /**
   * @param {String} service
   * @returns {Boolean}
   */
  static isGlobalService(service) {
    return Listing.GLOBAL_SERVICES.indexOf(service) !== -1;
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
   * @returns {String[]}
   */
  static get GLOBAL_SERVICES() {
    return ['IAM', 'CloudFront', 'S3'];
  }

  /**
   * @returns {String}
   */
  static get GLOBAL_REGION_KEY() {
    return 'global';
  }

  /**
   * Use us-east-1 to undeploy globally available resources (IAM, S3, etc)
   *
   * @returns {String}
   */
  static get GLOBAL_REGION_REPLACER() {
    return 'us-east-1';
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
