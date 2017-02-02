/**
 * Created by mgoria on 02/02/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class APIGatewayPlanDriver extends AbstractDriver {
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
    return 'APIGatewayPlan';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._awsService.deleteUsagePlan({usagePlanId: resourceId}, (error) => {
      cb(error);
    });
  }
}
