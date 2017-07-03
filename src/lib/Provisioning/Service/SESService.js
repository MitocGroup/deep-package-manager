/**
 * Created by CCristi on 8/18/16.
 */

'use strict';

import Core from 'deep-core';
import {AbstractService} from './AbstractService';

export class SESService extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.SIMPLE_EMAIL_SERVICE;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {SNSService}
   */
  _setup(services) {
    this._ready = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {SNSService}
   */
  _postProvision(services) {
    this._readyTeardown = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {SNSService}
   */
  _postDeployProvision(services) {
    this._ready = true;

    return this;
  }

  /**
   * @param {String[]} actions
   * @returns {Object}
   */
  generateAllowActionsStatement(actions = ['SendEmail']) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    actions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.SIMPLE_EMAIL_SERVICE, actionName);
    });

    statement.resource.add(
      Core.AWS.Service.SIMPLE_EMAIL_SERVICE,
      this.provisioning.ses.config.region,
      this.awsAccountId,
      'identity/*'
    );

    return statement;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.EU_WEST_IRELAND,
      Core.AWS.Region.US_EAST_VIRGINIA,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }
}
