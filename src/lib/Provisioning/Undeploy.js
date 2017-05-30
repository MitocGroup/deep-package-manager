/**
 * Created by AlexanderC on 11/25/15.
 */

'use strict';

import {AbstractDriver} from './UndeployDriver/AbstractDriver';
import {WaitFor} from '../Helpers/WaitFor';
import {Listing} from './Listing';
import {ProvisioningCollisionsListingException} from '../Property/Exception/ProvisioningCollisionsListingException';
import {OptimisticMatcher} from './UndeployMatcher/OptimisticMatcher';

export class Undeploy {
  /**
   * @param {Property|Object} property
   * @param {Boolean} debug
   * @param {AbstractMatcher} matcher
   */
  constructor(property, debug = false, matcher = Undeploy.DEFAULT_MATCHER) {
    this._property = property;
    this._hash = property.configObj.baseHash;
    this._matcher = matcher;
    this._debug = debug;
  }

  /**
   * @returns {Boolean}
   */
  get debug() {
    return this._debug;
  }

  /**
   * @param {Boolean} state
   */
  set debug(state) {
    this._debug = state;
  }

  /**
   * @returns {null}
   */
  get matcher() {
    return this._matcher;
  }

  /**
   * @param {null} matcher
   */
  set matcher(matcher) {
    this._matcher = matcher;
  }

  /**
   * @param {Function} callback
   * @param {String|RegExp|null} baseHash
   * @param {String[]} services
   * @returns {Undeploy}
   */
  execute(callback, baseHash = null, services = Undeploy.SERVICES) {
    let lister = this.newLister;

    // @todo: do it smarter?
    if (baseHash) {
      lister.hash = baseHash;
    }

    let regions = [this._property.config.awsRegion];

    if (this.matcher instanceof OptimisticMatcher) {
      regions = Listing.REGIONS;
    }

    lister.listAll((listingResult) => {
      if (lister.resultHasErrors(listingResult)) {
        callback(new ProvisioningCollisionsListingException(listingResult), null);
      } else if (lister.resultMatchedResources(listingResult) <= 0) {
        callback(null, null);
      } else {
        let wait = new WaitFor();
        let regions = Object.keys(listingResult);
        let servicesRemaining = regions.length * services.length;
        let results = Undeploy._createExecResultObj(regions, services);

        wait.push(() => {
          return servicesRemaining <= 0;
        });

        for (let region in listingResult) {
          if (!listingResult.hasOwnProperty(region)) {
            continue;
          }

          let rawResourcesObj = this._matcher.filter(listingResult[region].resources);

          for (let i in services) {
            if (!services.hasOwnProperty(i)) {
              continue;
            }

            let serviceName = services[i];

            let service = this._createAwsService(serviceName, region);
            let ServiceUndeployProto = require(`./UndeployDriver/${serviceName}Driver`)[`${serviceName}Driver`];

            let serviceUndeploy = new ServiceUndeployProto(service, this._hash, this._debug);

            serviceUndeploy.execute((error) => {
              servicesRemaining--;

              if (error) {
                results[region][serviceName].error = error;
              } else {
                results[region][serviceName].resources = serviceUndeploy.extractResetStack;
              }
            }, rawResourcesObj);
          }
        }

        wait.ready(() => {
          callback(null, results);
        });
      }
    }, services, regions);

    return this;
  }

  /**
   * @param {String} name
   * @param {String} region
   * @returns {AbstractDriver|*}
   */
  _createAwsService(name, region) {
    let service = this._property.provisioning.getAwsServiceByName(name);

    // create a new service instance with different region
    service = new service.constructor({region: region});

    AbstractDriver.injectServiceCredentials(
      service,
      {
        accessKeyId: this._property.config.aws.accessKeyId,
        secretAccessKey: this._property.config.aws.secretAccessKey,
        region: service.config.region,
      }
    );

    return service;
  }

  /**
   * @param {String[]} regions
   * @param {String[]} services
   * @returns {Object}
   * @private
   */
  static _createExecResultObj(regions, services) {
    let result = {};

    for (let key in regions) {
      if (!regions.hasOwnProperty(key)) {
        continue;
      }

      let region = regions[key];

      result[region] = {};

      for (let i in services) {
        if (!services.hasOwnProperty(i)) {
          continue;
        }

        let serviceName = services[i];

        result[region][serviceName] = {
          error: null,
          resources: [],
        };
      }
    }

    return result;
  }

  /**
   * @returns {Listing}
   */
  get newLister() {
    return new Listing(this._property);
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return Listing.SERVICES;
  }

  /**
   * @returns {AbstractMatcher}
   * @constructor
   */
  static get DEFAULT_MATCHER() {
    return new OptimisticMatcher();
  }
}
