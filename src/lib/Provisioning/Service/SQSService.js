/**
 * Created by mgoria on 01/19/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateSqsQueueException} from './Exception/FailedToCreateSqsQueueException';

/**
 * SQS service
 */
export class SQSService extends AbstractService {
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
    return Core.AWS.Service.SIMPLE_QUEUE_SERVICE;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
      Core.AWS.Region.ASIA_PACIFIC_SEOUL,
      Core.AWS.Region.ASIA_PACIFIC_SYDNEY,
      Core.AWS.Region.SOUTH_AMERICA_SAO_PAULO,
      Core.AWS.Region.ASIA_PACIFIC_SINGAPORE,
      Core.AWS.Region.EU_FRANKFURT,
      Core.AWS.Region.EU_IRELAND,
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.US_WEST_N_CALIFORNIA,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {SQSService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    let queuesConfig = {};

    let rum = this._getRumConfig();

    // @temp for testing
    rum.enabled = true;

    if (rum.enabled) {
      let rumQueueName = this.generateAwsResourceName('RumQueue', this.name());
      queuesConfig[rumQueueName] = {};
    }

    this._createQueues(
      queuesConfig
    )((queues) => {
      this._config.queues = queues;

      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {SQSService}
   */
  _postProvision(services) {
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {SQSService}
   */
  _postDeployProvision(services) {
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * Gets RUM config from global
   * @private
   */
  _getRumConfig() {
    let globalsConfig = this.property.config.globals;
    let rum = {
      enabled: false,
    };

    if (globalsConfig.logDrivers && globalsConfig.logDrivers.rum) {
      rum = globalsConfig.logDrivers.rum
    }

    return rum;
  }

  /**
   * @param {Object} queuesConfig
   * @returns {Function}
   * @private
   */
  _createQueues(queuesConfig) {
    let sqs = this.provisioning.sqs;
    let syncStack = new AwsRequestSyncStack();
    let queues = {};

    for (let queueName in queuesConfig) {
      if (!queuesConfig.hasOwnProperty(queueName)) {
        continue;
      }

      let params = {
        QueueName: queueName,
        Attributes: queuesConfig[queueName],
      };

      syncStack.push(sqs.createQueue(params), (error, data) => {
        if (error) {
          throw new FailedToCreateSqsQueueException(queueName, error);
        }

        queues[queueName] = data.QueueUrl;
      });
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(queues);
      });
    };
  }
}
