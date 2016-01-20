/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractService} from './Service/AbstractService';
import {WaitFor} from '../Helpers/WaitFor';

export class Listing {
  /**
   * @param {Property|Object} property
   */
  constructor(property) {
    this._property = property;
    this._hash = this._generateHash();
  }

  /**
   * @param {Function} callback
   * @param {String[]} services
   * @returns {Listing}
   */
  list(callback, services = Listing.SERVICES) {
    let wait = new WaitFor();
    let result = {
      matchedResources: 0,
      resources: {},
      errors: {},
    };
    let servicesRemaining = services.length;

    wait.push(() => {
      return servicesRemaining <= 0;
    });

    for (let i in services) {
      if (!services.hasOwnProperty(i)) {
        continue;
      }

      let serviceName = services[i];
      let service = this._createAwsService(serviceName);
      let ServiceListerProto = require(`./ListingDriver/${serviceName}Driver`)[`${serviceName}Driver`];

      let serviceLister = new ServiceListerProto(service, this._hash);

      serviceLister.list((error) => {
        servicesRemaining--;

        if (error) {
          result.errors[serviceName] = error;
        } else {
          result.resources[serviceName] = serviceLister.extractResetStack;
          result.matchedResources += Object.keys(result.resources[serviceName]).length;
        }
      });
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
   * @returns {String|RegExp}
   */
  get hash() {
    return this._hash;
  }

  /**
   * @param {String|RegExp} hash
   */
  set hash(hash) {
    this._hash = hash;
  }

  /**
   * @private
   */
  _generateHash() {
    return AbstractService.generateUniqueResourceHash(
      this._property.config.awsAccountId,
      this._property.identifier
    );
  }

  /**
   * @param {String} name
   * @returns {AbstractService}
   */
  _createAwsService(name) {
    return this._property.provisioning.getAwsServiceByName(name);
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return [
      'APIGateway', 'IAM', 'CognitoIdentity',
      'Lambda', 'CloudFront', 'DynamoDB', 'S3',
      'CloudWatchLogs', 'CloudSearch', 'SQS',
    ];
  }
}
