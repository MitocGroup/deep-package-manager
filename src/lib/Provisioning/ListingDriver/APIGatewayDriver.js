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
    this._awsService.listRestapis()
      .then((data) => {
        for (let i in data) {
          if (!data.hasOwnProperty(i)) {
            continue;
          }

          let source = data[i].source;
          let apiId = source.id;
          let apiName = source.name;

          this._checkPushStack(apiName, apiId, source);
        }

        cb(null);
      })
      .catch((error) => {
        cb(error);
      });
  }
}
