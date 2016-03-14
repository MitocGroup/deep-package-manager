/**
 * Created by mgoria on 3/11/16.
 */

'use strict';

import {AbstractService} from './Service/AbstractService';
import {WaitFor} from '../Helpers/WaitFor';

export class Describer {
  /**
   * @param {Property|Object} property
   * @param {Object} appConfig
   */
  constructor(property, appConfig) {
    this._property = property;
    this._appConfig = appConfig;
  }

  /**
   * @param {Function} callback
   * @param {String[]} services
   * @returns {Listing}
   */
  describe(callback, services = Describer.SERVICES) {
    let wait = new WaitFor();
    let result = {
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
      let ServiceDescriberProto = require(`./DescribeDriver/${serviceName}Driver`)[`${serviceName}Driver`];

      let serviceDescriber = new ServiceDescriberProto(service, this._appConfig);

      serviceDescriber.describe((error) => {
        servicesRemaining--;

        if (error) {
          result.errors[serviceName] = error;
        } else {
          result.resources[serviceName] = serviceDescriber.extractResetStack;
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
   * @param {String} name
   * @returns {AbstractService|*}
   */
  _createAwsService(name) {
    return this.property.provisioning.getAwsServiceByName(name);
  }

  /**
   * @returns {String[]}
   */
  static get SERVICES() {
    return ['ES'];
  }
}
