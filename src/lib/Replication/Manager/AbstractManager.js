/**
 * Created by CCristi on 2/6/17.
 */

'use strict';

import Core from 'deep-core';

export class AbstractManager extends Core.OOP.Interface {
  /**
   * @param {Instance} replicationInstance
   */
  constructor(replicationInstance) {
    super(['name']);

    this._replication = replicationInstance;
  }

  /**
   * @returns {Instance}
   */
  get replication() {
    return this._replication;
  }

  /**
   * @returns {Object}
   */
  blueConfig() {
    return this.replication.blueConfig.provisioning[this.name()];
  }

  /**
   * @returns {Object}
   */
  greenConfig() {
    return this.replication.greenConfig.provisioning[this.name()];
  }
}
