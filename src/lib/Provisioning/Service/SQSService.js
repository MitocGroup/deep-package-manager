/**
 * Created by mgoria on 01/19/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateSqsQueueException} from './Exception/FailedToCreateSqsQueueException';
import objectMerge from 'object-merge';

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
   * @returns {String}
   */
  static get RUM_QUEUE() {
    return 'rum';
  }

  /**
   * @returns {String}
   */
  static get DB_OFFLOAD_QUEUE() {
    return 'dbol';
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.AP_NORTHEAST_TOKYO,
      Core.AWS.Region.AP_NORTHEAST_SEOUL,
      Core.AWS.Region.AP_SOUTHEAST_SYDNEY,
      Core.AWS.Region.AP_SOUTHEAST_SINGAPORE,
      Core.AWS.Region.AP_SOUTH_MUMBAI,
      Core.AWS.Region.EU_CENTRAL_FRANKFURT,
      Core.AWS.Region.EU_WEST_IRELAND,
      Core.AWS.Region.EU_WEST_LONDON,
      Core.AWS.Region.SA_EAST_SAO_PAULO,
      Core.AWS.Region.CA_CENTRAL_MONTREAL,
      Core.AWS.Region.US_EAST_VIRGINIA,
      Core.AWS.Region.US_EAST_OHIO,
      Core.AWS.Region.US_WEST_CALIFORNIA,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {SQSService}
   */
  _setup(services) {
    let oldQueues = {};
    let queuesConfig = {};
    let rum = this.getRumConfig();
    let dbOffload = this.getDBOffloadConfig();
    let dbOffloadQueues = {};

    if (this._isUpdate) {
      oldQueues = this._config.queues || {};
      dbOffloadQueues = this._config.dbOffloadQueues || {};
    }

    if (rum.enabled && !oldQueues.hasOwnProperty(SQSService.RUM_QUEUE)) {
      queuesConfig[SQSService.RUM_QUEUE] = {}; // @note - here you can add some sqs queue config options
    }

    if (dbOffload.enabled) {
      this._dynamoDBModelsVector.forEach((modelName) => {
        let modelQueueName = `${SQSService.DB_OFFLOAD_QUEUE}-${modelName}`;

        if (!oldQueues.hasOwnProperty(modelQueueName)) {
          queuesConfig[modelQueueName] = {}; // @note - here you can add some sqs queue config options
          dbOffloadQueues[modelQueueName] = modelName;
        }
      });
    }

    this._createQueues(
      queuesConfig
    )((queues) => {
      this._config.queues = objectMerge(oldQueues, queues);
      this._config.dbOffloadQueues = dbOffloadQueues;

      this._ready = true;
    });

    return this;
  }

  /**
   * @returns {String[]}
   */
  get _dynamoDBModelsVector() {
    let modelsVector = [];
    let models = this.provisioning.property.config.models;

    for (let modelKey in models) {
      if (!models.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModels = models[modelKey];

      for (let modelName in backendModels) {
        if (!backendModels.hasOwnProperty(modelName)) {
          continue;
        }

        modelsVector.push(modelName);
      }
    }

    return modelsVector;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
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
   * @param {Core.Generic.ObjectStorage} services
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
   * @returns {Object}
   */
  getDBOffloadConfig() {
    return {
      enabled: true, // todo: Set it configurable from config or runtime
    };
  }

  /**
   * Gets RUM config from global
   * @returns {Object}
   */
  getRumConfig() {
    let globalsConfig = this.property.config.globals;
    let rum = {
      enabled: false,
    };

    if (globalsConfig.logDrivers && globalsConfig.logDrivers.rum) {
      rum = globalsConfig.logDrivers.rum;
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
        QueueName: this.generateAwsResourceName(
          `${AbstractService.capitalizeFirst(queueName)}Queue`,
          this.name()
        ),
        Attributes: queuesConfig[queueName],
      };

      syncStack.push(sqs.createQueue(params), (error, data) => {
        if (error) {
          throw new FailedToCreateSqsQueueException(params.QueueName, error);
        }

        queues[queueName] = {
          name: params.QueueName,
          url: data.QueueUrl,
        };
      });
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(queues);
      });
    };
  }

  /**
   * Allow Cognito Identities and Lambda functions to send messages to SQS queue
   *
   * @param {Array} actions
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowActionsStatement(actions = ['SendMessage', 'SendMessageBatch']) {
    let policy = new Core.AWS.IAM.Policy();

    let statement = policy.statement.add();

    actions.forEach((action) => {
      statement.action.add(Core.AWS.Service.SIMPLE_QUEUE_SERVICE, action);
    });

    statement.resource.add(
      Core.AWS.Service.SIMPLE_QUEUE_SERVICE,
      this.provisioning.sqs.config.region,
      this.awsAccountId,
      this._getGlobalResourceMask()
    );

    return statement;
  }
}
