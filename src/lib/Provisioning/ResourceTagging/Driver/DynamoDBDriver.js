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
