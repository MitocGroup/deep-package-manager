/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CloudWatchEventsDriver extends AbstractDriver {
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
    this._listRules(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextToken
   * @private
   */
  _listRules(cb, nextToken = null) {
    let payload = {};

    if (nextToken) {
      payload.NextToken = nextToken;
    }

    this._awsService.listRules(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.Rules) {
        if (!data.Rules.hasOwnProperty(i)) {
          continue;
        }

        let ruleData = data.Rules[i];
        let ruleName = ruleData.Name;

        this._checkPushStack(ruleName, ruleName, ruleData);
      }

      if (data.NextToken) {
        let nextBatchToken = data.NextToken;

        this._listRules(cb, nextBatchToken);
      } else {
        cb(null);
      }
    });
  }
}
