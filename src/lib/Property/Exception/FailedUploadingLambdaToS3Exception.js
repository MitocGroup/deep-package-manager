/**
 * Created by mgoria on 7/9/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * Throws when lambda upload to s3 fails
 */
export class FailedUploadingLambdaToS3Exception extends Exception {
    /**
     * @param {String} lambdaName
     * @param {String} bucketName
     * @param {String} error
     */
  constructor(lambdaName, bucketName, error) {
    super(`Error uploading "${lambdaName}" lambda to "${bucketName}" bucket. ${error}`);
  }
}
