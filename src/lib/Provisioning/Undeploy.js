/**
 * Created by AlexanderC on 11/25/15.
 */

'use strict';

import {AbstractService} from './Service/AbstractService';
import Core from 'deep-core';
import {Client as AwsApiGatewayClient} from 'aws-api-gw-client';
import AWS from 'aws-sdk';
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
    let results = Undeploy._createExecResultObj(services);

    // @todo: do it smarter?
    if (baseHash) {
      lister.hash = baseHash;
    }

    lister.list((listingResult) => {
      if (Object.keys(listingResult.errors).length > 0) {
        callback(new ProvisioningCollisionsListingException(listingResult.errors), null);
      } else if (listingResult.matchedResources <= 0) {
        callback(null, results);
      } else {
        let wait = new WaitFor();
        let servicesRemaining = services.length;
        let rawResourcesObj = this._matcher.filter(listingResult.resources);

        wait.push(() => {
          return servicesRemaining <= 0;
        });

        for (let i in services) {
          if (!services.hasOwnProperty(i)) {
            continue;
          }

          let serviceName = services[i];
          let service = this._createAwsService(serviceName);
          let ServiceUndeployProto = require(`./UndeployDriver/${serviceName}Driver`)[`${serviceName}Driver`];

          let serviceUndeploy = new ServiceUndeployProto(service, this._debug);

          serviceUndeploy.execute((error) => {
            servicesRemaining--;

            if (error) {
              results[serviceName].error = error;
            } else {
              results[serviceName].resources = serviceUndeploy.extractResetStack;
            }
          }, rawResourcesObj);
        }

        wait.ready(() => {
          callback(null, results);
        });
      }
    }, services);

    return this;
  }

  /**
   * @param {String} name
   * @returns {AbstractService|AwsApiGatewayClient}
   */
  _createAwsService(name) {
    let serviceName = `${name}Service`;
    let ServiceProto = require(`./Service/${serviceName}`)[serviceName];

    let appropriateRegion = Core.AWS.Region.getAppropriateAwsRegion(
      this._property.config.aws.region,
      ServiceProto.AVAILABLE_REGIONS
    );

    // @todo: replace with native API when ready
    if (name === 'APIGateway') {
      return new AwsApiGatewayClient({
        accessKeyId: this._property.config.aws.accessKeyId,
        secretAccessKey: this._property.config.aws.secretAccessKey,
        region: appropriateRegion,
      });
    }

    return new AWS[name]({
      region: appropriateRegion,
    });
  }

  /**
   * @param {String[]} services
   * @returns {Object}
   * @private
   */
  static _createExecResultObj(services) {
    let result = {};

    for (let i in services) {
      if (!services.hasOwnProperty(i)) {
        continue;
      }

      let serviceName = services[i];

      result[serviceName] = {
        error: null,
        resources: [],
      };
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