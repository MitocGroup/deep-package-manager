/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import Core from 'deep-core';
import os from 'os';
import {Prompt} from '../../Helpers/Terminal/Prompt';

export class AbstractStrategy extends Core.OOP.Interface {
  /**
   * @param {Replication/Instance} replication
   * @param {Boolean} skipDNSActions
   */
  constructor(replication, skipDNSActions) {
    super(['publish', 'update', 'config']);

    this._replication = replication;
    this._skipDNSActions = skipDNSActions;
    this._config = {
      hash: replication.hashCode,
    };
  }

  /**
   * @returns {Boolean|*}
   */
  get skipDNSActions() {
    return this._skipDNSActions;
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

  /**
   * @param {RecordSetAction[]} recordSetActions
   * @returns {Boolean}
   */
  askRecordChangePermissions(recordSetActions) {
    let promptQuestion = ['Following Route53 actions are going to be executed: ',]
      .concat(recordSetActions.map(rSetA => rSetA.toString()))
      .concat('Please confirm those changes')
      .join(os.EOL);

    let prompt = new Prompt(promptQuestion);
    let confirmBool = null;

    prompt.syncMode = true;
    prompt.readConfirm(confirm => {
      confirmBool = confirm;
    });

    return confirmBool;
  }

  /**
   * @param {Object} config
   * @returns {AbstractStrategy|BalancedStrategy}
   */
  updateConfig(config) {
    this._config = config;

    this._onConfigUpdate(config);

    return this;
  }

  /**
   * @returns {Object}
   */
  config() {
    return this._config;
  }

  /**
   * @private
   */
  _onConfigUpdate() {
    // inherit this
  }
}
