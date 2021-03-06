/**
 * Created by CCristi on 2/17/17.
 */

/* eslint no-unreachable:0 */

'use strict';

import {AbstractManager} from './AbstractManager';

export class DBManager extends AbstractManager {
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
    return 'DB';
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  prepare(tables) {
    return Promise.all(
      tables
        .map(table => this.dynamoDbService.getAwsBlueTableName(table))
        .map(table => {
          console.debug(`Enabling dynamoDB streams for "${table}"`);

          return this.dynamoDbService
            .enableDynamoDBStreams(table)
            .then(tableConfig => {
              console.debug(`Enabling trigger function for "${tableConfig.LatestStreamArn}" stream.`);

              return this.lambdaService.createDynamoDBStreamTriggerFunction(tableConfig.LatestStreamArn);
            })
            .then(() => {
              console.info(`"${table}" DynamoDB stream enabled.`);

              return this.lambdaService.startTableBackFillLambda(table)
                .then(() => {
                  console.debug(`"${table}" table backfill started.`);
                });
            });
        })
    );
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  start(tables) {
    return Promise.all(
      tables
        .map(table => this.dynamoDbService.getAwsGreenTableName(table))
        .map(table => {
          console.debug(`Enabling dynamoDB streams for "${table}"`);

          return this.dynamoDbService
            .enableDynamoDBStreams(table)
            .then(tableConfig => {
              console.debug(`Enabling trigger function for "${tableConfig.LatestStreamArn}" stream.`);

              return this.lambdaService.createDynamoDBStreamTriggerFunction(tableConfig.LatestStreamArn);
            })
            .then(() => {
              console.info(`"${table}" DynamoDB stream enabled.`);
            });
        })
    );
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   * @private
   */
  _stopTablesReplication(tables) {
    let stopTriggersPromise = this.lambdaService
      .stopDynamoDBStreamTriggerFunctions(tables)
      .then(() => {
        console.debug(`Lambda replication triggers have been removed for "${tables.join(', ')}"`);
      });

    let stopDynamoDBStreamsPromises = tables.map(
      table => {
        return this.dynamoDbService
          .disableDynamoDBStreams(table)
          .then(() => {
            console.debug(`DynamoDB streams have been disabled for "${table}"`);
          });
      }
    );

    return Promise.all([
      stopTriggersPromise,
      Promise.all(stopDynamoDBStreamsPromises),
    ]);
  }

  /**
   * @param {String[]} tables
   * @returns {Promise}
   */
  stop(tables) {
    return Promise.all([
      this._stopTablesReplication(tables.map(t => this.dynamoDbService.getAwsBlueTableName(t))),
      this._stopTablesReplication(tables.map(t => this.dynamoDbService.getAwsGreenTableName(t))),
    ]);
  }

  /**
   * @param {String} model
   * @returns {Promise}
   * @private
   */
  _checkModelStatus(model) {
    //@todo: find other way to check if dynamodb model is backfilled, ItemCount data may have a 6 hours delay
    return Promise.resolve(1.0);

    let blueTable = this.dynamoDbService.getAwsBlueTableName(model);
    let greenTable = this.dynamoDbService.getAwsGreenTableName(model);

    return Promise.all([
      this.dynamoDbService.getItemCount(blueTable),
      this.dynamoDbService.getItemCount(greenTable),
    ]).then(results => {
      let bCount = results[0];
      let gCount = results[1];

      if (gCount === 0 || bCount > gCount) {
        return 1.0;
      }

      return bCount / gCount;
    });
  }

  /**
   * @param {String[]} models
   * @returns {Promise}
   */
  checkStatus(models) {
    let statusMap = {};

    return Promise.all(
      models.map(modelName => {
        return this._checkModelStatus(modelName).then(status => {
          statusMap[modelName] = status;
        });
      })
    ).then(() => statusMap);
  }
}
