/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import DB from 'deep-db';
import {SQSService} from './SQSService';
import {LambdaService} from './LambdaService';

/**
 * DynamoDB service
 */
export class DynamoDBService extends AbstractService {
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
    return Core.AWS.Service.DYNAMO_DB;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
   */
  _setup(services) {
    this._createDbTables(
      this._rawModels,
      this._rawModelsSettings
    )((tablesNames) => {
      this._config.tablesNames = tablesNames;

      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {DynamoDBService}
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
   * @returns {DynamoDBService}
   */
  _postDeployProvision(services) {
    this._attachEventualConsistencyAlarms(() => {
      this._ready = true;
    });

    return this;
  }

  /**
   * @returns {String}
   */
  get _eventualConsistencyEnspoint() {
    let globalsConfig = this.property.config.globals;

    return globalsConfig.storage.eventualConsistency.offloaderEndpoint;
  }

  /**
   * @param {Function} cb
   * @private
   */
  _attachEventualConsistencyAlarms(cb) {
    let offloadingBackendArn = null;
    let offloadingBackendName = null;
    let offloadQueuesNames = [];

    try {
      let offloadingEndpoint = this._eventualConsistencyEnspoint;

      if (!offloadingEndpoint) {
        throw new Error('Missing eventual consistency offloading endpoint from globals config');
      }

      let offloadEndpointParts = offloadingEndpoint.replace(/^@/, '').split(':');
      let offloadMicroserviceIdentifier = offloadEndpointParts[0];
      let offloadActionIdentifier = `${offloadEndpointParts[1]}-${offloadEndpointParts[2]}`;
      let lambda = this.provisioning.lambda;
      let lambdaConfig = this.provisioning.services.find(LambdaService).config();
      offloadingBackendName = lambdaConfig.names[offloadMicroserviceIdentifier][offloadActionIdentifier];
      offloadingBackendArn = this._generateLambdaArn(lambda, offloadingBackendName);

      let sqsConfig = this.provisioning.services.find(SQSService).config();
      let offloadQueuesVector = Object.keys(sqsConfig.dbOffloadQueues);

      for (let queueShortName in sqsConfig.queues) {
        if (!sqsConfig.queues.hasOwnProperty(queueShortName) ||
          offloadQueuesVector.indexOf(queueShortName) === -1) {
          continue;
        }

        offloadQueuesNames.push(sqsConfig.queues[queueShortName].name);
      }

      if (offloadQueuesNames.length <= 0) {
        return cb();
      }
    } catch (error) {
      console.warn(error);
      return cb();
    }

    console.debug(`Setting up eventual consistency using queues: ${offloadQueuesNames.join(', ')}`);

    this._ensureSnsTopicsForEventualConsistency(offloadQueuesNames)
      .then((...args) => {
        console.debug('Ensure CloudWatch Alarms set up for eventual consistency');

        this._ensureCloudWatchAlarmsForEventualConsistency(offloadQueuesNames, ...args)
          .then((...args) => {
            console.debug('Ensure eventual consistency offload backend subscribed to SNS topics');

            this._ensureLambdasSubscribedToEventualConsistencyTopics(offloadingBackendArn, offloadingBackendName, offloadQueuesNames, ...args)
              .then(cb)
              .catch(error => {
                console.warn(error);
                cb();
              });
          }).catch(error => {
            console.warn(error);
            cb();
          });
      }).catch(error => {
        console.warn(error);
        cb();
      });
  }

  /**
   * @param {String} offloadingBackendArn
   * @param {String} offloadingBackendName
   * @param {String[]} offloadQueuesNames
   * @param {Object} snsTopicsMapping
   * @returns {Promise|*}
   */
  _ensureLambdasSubscribedToEventualConsistencyTopics(offloadingBackendArn, offloadingBackendName, offloadQueuesNames, snsTopicsMapping) {
    return new Promise((resolve, reject) => {
      let sns = this.provisioning.sns;
      let lambda = this.provisioning.lambda;
      let cloudWatchEvents = this.provisioning.cloudWatchEvents;

      let premises = offloadQueuesNames.map(topicName => {
        return this._subscribeLambdaToSnsTopic(
          sns,
          lambda,
          cloudWatchEvents,
          topicName,
          offloadingBackendArn,
          offloadingBackendName,
          snsTopicsMapping[topicName]
        );
      });

      Promise.all(premises).then(resolve);
    });
  }

  /**
   * @param {*} sns
   * @param {*} lambda
   * @param {*} cloudWatchEvents
   * @param {String} topicName
   * @param {String} lambdaArn
   * @param {String} lambdaName
   * @param {String} topicArn
   * @returns {Promise|*}
   */
  _subscribeLambdaToSnsTopic(sns, lambda, cloudWatchEvents, topicName, lambdaArn, lambdaName, topicArn) {
    return new Promise((resolve, reject) => {
      let subscribePayload = {
        TopicArn: topicArn,
        Protocol: 'lambda',
        Endpoint: lambdaArn,
      };

      sns.subscribe(subscribePayload, error => {
        if (error) {
          console.warn(error);
        }

        let permissionsPayload = {
          Action: `${Core.AWS.Service.LAMBDA}:InvokeFunction`,
          Principal: Core.AWS.Service.identifier(Core.AWS.Service.SIMPLE_NOTIFICATION_SERVICE),
          FunctionName: lambdaArn,
          StatementId: lambdaName,
        };

        lambda.addPermission(permissionsPayload, error => {
          if (error && error.code !== 'ResourceConflictException') {
            console.warn(error);
          }

          resolve();
        });
      });
    });
  }

  /**
   * @param {String[]} offloadQueuesNames
   * @param {Object} snsTopicsMapping
   * @returns {Promise|*}
   */
  _ensureCloudWatchAlarmsForEventualConsistency(offloadQueuesNames, snsTopicsMapping) {
    return new Promise((resolve, reject) => {
      let cloudWatch = this.provisioning.cloudWatch;

      let listAlarmsPayload = {
        AlarmNames: offloadQueuesNames,
      };

      cloudWatch.describeAlarms(listAlarmsPayload, (error, data) => {
        if (error) {
          return reject(error);
        }

        let existingAlarms = (data.MetricAlarms || []).map(alarm => alarm.AlarmName);

        let premises = offloadQueuesNames
          .filter(alarmName => existingAlarms.indexOf(alarmName) === -1)
          .map(alarmName => {
            return this._createCloudWatchAlarmForEventualConsistency(
              cloudWatch,
              alarmName,
              snsTopicsMapping[alarmName]
            );
          });

          Promise.all(premises).then(() => {
            resolve(snsTopicsMapping);
          });
      });
    });
  }

  /**
   * @param {*} cloudWatch
   * @param {String} alarmName
   * @param {String} snsTopicArn
   * @returns {Promise|*}
   */
  _createCloudWatchAlarmForEventualConsistency(cloudWatch, alarmName, snsTopicArn) {
    return new Promise((resolve, reject) => {
      let payload = {
        AlarmName: alarmName,
        ComparisonOperator: 'GreaterThanThreshold',
        EvaluationPeriods: 1,
        MetricName: 'ApproximateNumberOfMessagesVisible',
        Namespace: 'AWS/SQS',
        Period: 60,
        Statistic: 'Minimum',
        Threshold: 0.0,
        ActionsEnabled: true,
        AlarmActions: [
          snsTopicArn,
        ],
        AlarmDescription: `DynamoDB eventual consistency data offload from queue ${alarmName}`,
        Dimensions: [
          {
            Name: 'QueueName',
            Value: alarmName,
          },
        ],
        Unit: 'Count',
      };

      cloudWatch.putMetricAlarm(payload, error => {
        if (error && error.code !== 'ResourceConflictException') {
          console.warn(error);
        }

        resolve();
      });
    });
  }

  /**
   * @param {String[]} offloadQueuesNames
   * @returns {Promise|*}
   */
  _ensureSnsTopicsForEventualConsistency(offloadQueuesNames) {
    return new Promise((resolve, reject) => {
      let sns = this.provisioning.sns;
      let snsTopicsMapping = {};

      offloadQueuesNames.forEach(queueName => {
        snsTopicsMapping[queueName] = this._generateTopicArn(sns, queueName);
      });

      let premises = offloadQueuesNames.map(topicName => {
        return this._createSnsTopicForEventualConsistency(sns, topicName);
      });

      Promise.all(premises)
        .then(() => {
          resolve(snsTopicsMapping);
        });
    });
  }

  /**
   * @param {*} sns
   * @param {String} topicName
   * @returns {Promise|*}
   */
  _createSnsTopicForEventualConsistency(sns, topicName) {
    return new Promise((resolve, reject) => {
      let payload = {
        Name: topicName,
      };

      sns.createTopic(payload, error => {
        if (error && error.code !== 'ResourceConflictException') {
          console.warn(error);
        }

        resolve();
      });
    });
  }

  /**
   * @param {String} functionId
   * @returns {String}
   */
  _generateLambdaArn(lambda, functionId) {
    return `arn:aws:lambda:${lambda.config.region}:${this.awsAccountId}:function:${functionId}`;
  }

  /**
   * @param {*} sns
   * @param {String} topicName
   * @returns {String}
   */
  _generateTopicArn(sns, topicName) {
    return `arn:aws:sns:${sns.config.region}:${this.awsAccountId}:${topicName}`;
  }

  /**
   * @param {Object} models
   * @param {Object} modelsSettings
   * @returns {Function}
   * @private
   */
  _createDbTables(models, modelsSettings) {
    let tablesNames = this.generateTableNames(models);
    let tablesSettings = this.generateTableSettings(modelsSettings);
    let missingTablesNames = [];

    if (this._isUpdate) {
      let tablesNamesVector = DynamoDBService._objectValues(tablesNames);

      missingTablesNames = DynamoDBService._objectValues(this._config.tablesNames)
        .filter((x) => tablesNamesVector.indexOf(x) < 0);
    }

    let deepDb = new DB(models, tablesNames);

    // @todo waiting for https://github.com/aws/aws-sdk-js/issues/710 to be fixed
    deepDb._setVogelsDriver(this.provisioning.dynamoDB);

    // @todo: move this functionality?
    this._provisioning.db = deepDb;

    return (callback) => {
      for (let name in tablesSettings) {
        if (!tablesSettings.hasOwnProperty(name)) {
          continue;
        }

        console.debug(`DynamoDB model '${name}' -> ${JSON.stringify(tablesSettings[name])}`);
      }

      deepDb.assureTables(() => {
        if (missingTablesNames.length <= 0) {
          callback(tablesNames);
          return;
        }

        this._removeMissingTables(missingTablesNames, () => {
          callback(tablesNames);
        });
      }, tablesSettings);
    };
  }

  /**
   * @param {Object} obj
   * @returns {Array}
   * @private
   */
  static _objectValues(obj) {
    let values = [];

    for (let tableId in obj) {
      if (!obj.hasOwnProperty(tableId)) {
        continue;
      }

      values.push(obj[tableId]);
    }

    return values;
  }

  /**
   * @param {String[]} missingTablesNames
   * @param {Function} callback
   * @returns {DynamoDBService}
   * @private
   */
  _removeMissingTables(missingTablesNames, callback) {
    console.debug(`Removing DynamoDB tables: ${missingTablesNames.join(', ')}`);

    for (let i in missingTablesNames) {
      if (!missingTablesNames.hasOwnProperty(i)) {
        continue;
      }

      let tableName = missingTablesNames[i];

      this.provisioning.dynamoDB.deleteTable({
        TableName: tableName,
      }, (error, data) => {
        if (error) {
          console.error(`Error while deleting DynamoDB table ${tableName}: ${error}`);
        }
      });
    }

    // @todo: leave it async?
    callback();

    return this;
  }

  /**
   * @returns {Object}
   * @private
   */
  get _rawModels() {
    return this.provisioning.property.config.models;
  }

  /**
   * @returns {Object}
   * @private
   */
  get _rawModelsSettings() {
    return this.provisioning.property.config.modelsSettings;
  }

  /**
   * @param {Object} models
   * @returns {Object}
   */
  generateTableNames(models) {
    let tables = {};

    for (let modelKey in models) {
      if (!models.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModels = models[modelKey];

      for (let modelName in backendModels) {
        if (!backendModels.hasOwnProperty(modelName)) {
          continue;
        }

        tables[modelName] = this.generateAwsResourceName(modelName, Core.AWS.Service.DYNAMO_DB);
      }
    }

    return tables;
  }

  /**
   * @param {Object} modelsSettings
   * @returns {Object}
   */
  generateTableSettings(modelsSettings) {
    let tables = {};

    for (let modelKey in modelsSettings) {
      if (!modelsSettings.hasOwnProperty(modelKey)) {
        continue;
      }

      let backendModelsSettings = modelsSettings[modelKey];

      for (let modelName in backendModelsSettings) {
        if (!backendModelsSettings.hasOwnProperty(modelName)) {
          continue;
        }

        tables[modelName] = backendModelsSettings[modelName];
      }
    }

    return tables;
  }
}
