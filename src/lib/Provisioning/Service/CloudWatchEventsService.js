/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/23/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';

/**
 * Cloud Watch Events Service
 */
export class CloudWatchEventsService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.CLOUD_WATCH_EVENTS;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchEventsService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchEventsService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchEventsService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Object[]} effects
   * @allowed: ['enable', 'disable', 'delete', 'describe']
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowEffectEventsRulesStatement(effects = ['enable', 'disable']) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    effects.forEach((effect) => {
      statement.action.add(Core.AWS.Service.CLOUD_WATCH_EVENTS, `${effect}Rule`);
    });

    statement.resource.add(
      Core.AWS.Service.CLOUD_WATCH_EVENTS,
      this.provisioning.cloudWatchEvents.config.region,
      this.awsAccountId,
      `rule/${this._getGlobalResourceMask()}`
    );

    return statement;
  }
}
