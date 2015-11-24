/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class LambdaDriver extends AbstractDriver {
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
    this._awsService.listFunctions({
      MaxItems: LambdaDriver.MAX_ITEMS,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.Functions) {
        if (!data.Functions.hasOwnProperty(i)) {
          continue;
        }

        let lambdaData = data.Functions[i];
        let functionName = lambdaData.FunctionName;

        this._checkPushStack(functionName, functionName, lambdaData);
      }

      cb(null);
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 1000;
  }
}
