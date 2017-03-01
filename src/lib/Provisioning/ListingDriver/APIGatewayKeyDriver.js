/**
 * Created by mgoria on 28/02/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {APIGatewayService} from '../Service/APIGatewayService';

export class APIGatewayKeyDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._awsService.getApiKeys({limit: APIGatewayService.PAGE_LIMIT}, (error, data) => {
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
