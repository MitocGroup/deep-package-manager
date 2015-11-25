/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class APIGatewayDriver extends AbstractDriver {
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
    this._awsService.getRestApis({limit: 500}, (error, data) => {
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
