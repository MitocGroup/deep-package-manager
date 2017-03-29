/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import Core from 'deep-core';

export class AbstractStrategy extends Core.OOP.Interface {
  /**
   * @param {Replication} replication
   */
  constructor(replication) {
    super(['publish']);

    this._replication = replication;
  }

  /**
   * @returns {Replication/Instance|*}
   */
  get replication() {
    return this._replication;
  }

  /**
   * @param {Number} percentage
   * @returns {AbstractStrategy}
   */
  static chooseStrategyProto(percentage) {
    if (percentage === 100) {
      return require('./CompleteStrategy').CompleteStrategy;
    } else {
      return require('./BalancedStrategy').BalancedStrategy;
    }
  }
}
