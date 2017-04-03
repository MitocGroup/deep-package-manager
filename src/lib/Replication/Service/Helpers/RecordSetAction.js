/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

export class RecordSetAction {
  /**
   * @param {Object} recordSet
   */
  constructor(recordSet) {
    this._recordSet = JSON.parse(JSON.stringify(recordSet));
    this._action = RecordSetAction.CREATE;
  }

  /**
   * @param {String} action
   */
  set action(action) {
    this._action = action;
  }

  /**
   * @returns {RecordSetAction}
   */
  delete() {
    this._action = RecordSetAction.DELETE;

    return this;
  }

  /**
   * @returns {RecordSetAction}
   */
  create() {
    this._action = RecordSetAction.DELETE;

    return this;
  }

  /**
   * @returns {RecordSetAction}
   */
  upsert() {
    this._action = RecordSetAction.UPSERT;

    return this;
  }

  /**
   * @param {Object} aliasTarget
   * @returns {RecordSetAction}
   */
  aliasTarget(aliasTarget) {
    this._recordSet.AliasTarget = aliasTarget;

    return this;
  }

  /**
   * @returns {Object}
   */
  extract() {
    let recordSet = {
      Name: this._recordSet.Name,
      Type: this._recordSet.Type,
    };

    if ([RecordSetAction.CREATE, RecordSetAction.UPSERT].indexOf(this._action)) {
      recordSet.AliasTarget = this._recordSet.AliasTarget;
    }

    return {
      Action: this._action,
      ResourceRecordSet: recordSet,
    };
  }

  /**
   * @returns {String}
   */
  toString() {
    let actionStr = `${this._action} ${this._recordSet.Name} of type ${this._recordSet.Type}`;

    if (this._recordSet.AliasTarget) {
      actionStr += ` alias ${this._action === RecordSetAction.UPSERT ? 'change to' : 'for'}` +
        ` ${this._recordSet.AliasTarget.DNSName}`;
    }

    return actionStr;
  }

  /**
   * @returns {String}
   */
  static get CREATE() {
    return 'CREATE';
  }

  /**
   * @returns {String}
   */
  static get DELETE() {
    return 'DELETE';
  }

  /**
   * Update if exists else create
   *
   * @returns {String}
   */
  static get UPSERT() {
    return 'UPSERT';
  }
}
