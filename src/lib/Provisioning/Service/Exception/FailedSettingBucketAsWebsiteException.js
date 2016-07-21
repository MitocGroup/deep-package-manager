/**
 * Created by mgoria on 6/8/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when failed to set a bucket as static website hosting
 */
export class FailedSettingBucketAsWebsiteException extends Exception {
    /**
     * @param {String} bucketName
     * @param {String} error
     */
  constructor(bucketName, error) {
    super(`Error on setting bucket "${bucketName}" as static website hosting. ${error}`);
  }
}
