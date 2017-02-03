/**
 * Created by CCristi on 2/2/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import Core from 'deep-core';

export class DynamoDBDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._dynamoDB = this.provisioning.dynamoDB;
  }

  /**
   * @param {Function} callback
   */
  tag(callback) {
    let tagsPayload = this.tagsPayload;

    let tagPromises = this.tablesArns.map(tableArn => {
      let payload = {
        ResourceArn: tableArn,
        Tags: tagsPayload,
      };

      return this._dynamoDB.tagResource(payload).promise().then(() => {
        console.debug(`"${tableArn}" has been successfully tagged`);
      }).catch(e => {
        console.warn(`Error on tagging "${tableArn}": ${e}`);
      });
    });

    Promise.all(tagPromises)
      .then(responses => callback(null, responses))
      .catch(e => callback(e, null));
  }

  /**
   * @returns {String[]}
   */
  get tablesArns() {
    let config = this.property.config;
    let tablesObj = this.provisioning.config[Core.AWS.Service.DYNAMO_DB].tablesNames;
    let tableArns = [];

    for (let modelName in tablesObj) {
      if (tablesObj.hasOwnProperty(modelName)) {
        tableArns.push(
          `arn:aws:${Core.AWS.Service.DYNAMO_DB}:${config.aws.region}:` + 
          `${config.awsAccountId}:table/${tablesObj[modelName]}`
        );
      }
    }

    return tableArns;
  }
}
