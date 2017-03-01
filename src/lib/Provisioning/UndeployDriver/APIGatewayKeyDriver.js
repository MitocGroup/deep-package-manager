/**
 * Created by mgoria on 28/02/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class APIGatewayKeyDriver extends AbstractDriver {
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
    return 'APIGatewayKey';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._awsService.deleteApiKey({apiKey: resourceId}, (error) => {
      cb(error);
    });
  }
}
