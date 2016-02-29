/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';

export class CloudWatchLogsService extends AbstractService {
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
    return Core.AWS.Service.CLOUD_WATCH_LOGS;
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
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchLogsService}
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
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchLogsService}
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
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudWatchLogsService}
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
   * // @todo - limit access to CloudWatch logs from * to certain actions and log groups
   * Allow full access to CloudWatch logs
   *
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowFullAccessStatement() {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    statement.action.add(Core.AWS.Service.CLOUD_WATCH_LOGS, Core.AWS.IAM.Policy.ANY);
    statement.resource.add(
      Core.AWS.Service.CLOUD_WATCH_LOGS,
      Core.AWS.IAM.Policy.ANY,
      this.awsAccountId,
      Core.AWS.IAM.Policy.ANY
    );

    return statement;
  }
}
