'use strict';

import Core from 'deep-core';
import { AbstractDriver } from './AbstractDriver';

export class DynamoDBDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._dynamoDB = this.provisioning.dynamoDB;
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.dynamoDB.config.region;
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
  resourcesArns() {
    let tableArns = [];
    let config = this.property.config;
    let tablesObj = this.provisioning.config[Core.AWS.Service.DYNAMO_DB].tablesNames;

    for (let modelName in tablesObj) {
      if (tablesObj.hasOwnProperty(modelName)) {
        tableArns.push(
          `arn:aws:${this.name()}:${config.aws.region}:${config.awsAccountId}:table/${tablesObj[modelName]}`
        );
      }
    }

    return tableArns;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let ddbArns = this.resourcesArns();
    if (ddbArns.length === 0) {
      cb();
      return;
    }

    let promises = ddbArns.map(arn => {
      return this._dynamoDB.tagResource({
        ResourceArn: arn,
        Tags: this.dynamoDbTags()
      }).promise();
    });

    Promise.all(promises).then(res => {
      console.debug('DynamoDB resources have been successfully tagged');
      cb();
    }).catch(err => {
      console.warn('Error while tagging DynamoDB resources: ', err);
      cb();
    });
  }

  /**
   * Convert tags object into array
   * @returns {Array}
   */
  dynamoDbTags() {
    let result = [];
    let tagsObj = this.tags;

    for (let tagKey in tagsObj) {
      if (tagsObj.hasOwnProperty(tagKey)) {
        result.push({
          Key: tagKey,
          Value: tagsObj[tagKey]
        });
      }
    }

    return result;
  }
}
