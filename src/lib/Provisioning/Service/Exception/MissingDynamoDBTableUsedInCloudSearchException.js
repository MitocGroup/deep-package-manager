/**
 * Created by AlexanderC on 9/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class MissingDynamoDBTableUsedInCloudSearchException extends Exception {
  /**
   * @param {String} tableName
   */
  constructor(tableName) {
    super(`Missing DynamoDB table ${tableName} used in CloudSearch`);
  }
}
