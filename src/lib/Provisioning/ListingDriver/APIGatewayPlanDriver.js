/**
 * Created by mgoria on 02/02/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {APIGatewayService} from '../Service/APIGatewayService';

export class APIGatewayPlanDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return APIGatewayService.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._awsService.getUsagePlans({limit: APIGatewayService.PAGE_LIMIT}, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      let items = data.items;

      for (let i in items) {
        if (!items.hasOwnProperty(i)) {
          continue;
        }

        let item = items[i];

        this._checkPushStack(item.name, item.id, item);
      }

      cb(null);
    });
  }
}
