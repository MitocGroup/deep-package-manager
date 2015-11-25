/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CognitoIdentityDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'CognitoIdentity';
  }

  /**
   * @param {Function} cb
   * @param {Object} resources
   */
  _execute(cb, resources) {
    for (let i in resources) {
      if (!resources.hasOwnProperty(i)) {
        continue;
      }

      let resourceInfo = resources[i];

      console.log(this.service(), i); //@todo:remove
    }

    cb(null);
  }
}
