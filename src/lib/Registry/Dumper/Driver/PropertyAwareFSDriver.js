/**
 * Created by AlexanderC on 2/18/16.
 */

'use strict';

import {FSDriver} from './FSDriver';

export class PropertyAwareFSDriver extends FSDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._property = null;
  }

  /**
   * @returns {Property|Instance|null}
   */
  get property() {
    return this._property;
  }

  /**
   * @param {Property|Instance|null} property
   */
  set property(property) {
    this._property = property;
  }

  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {Function} cb
   */
  hasToDump(moduleName, moduleVersion, cb) {
    let microservices = this._property.microservices;

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      if (microservice.identifier === moduleName) {
        cb(null, false);
        return;
      }
    }

    cb(null, true);
  }
}
