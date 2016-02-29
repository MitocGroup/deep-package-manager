/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedSettingCORSException extends Exception {
  /**
   * @param {String} bucketName
   * @param {String} error
   */
  constructor(bucketName, error) {
    super(`Error on setting up CORS on bucket "${bucketName}": ${error}`);
  }
}
