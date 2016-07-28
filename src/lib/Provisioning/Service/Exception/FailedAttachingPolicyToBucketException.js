/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * throws when failed to attach bucket policy
 */
export class FailedAttachingPolicyToBucketException extends Exception {
    /**
     * @param {String} bucketName
     * @param {String} error
     */
  constructor(bucketName, error) {
    super(`Error on attaching policy to "${bucketName}" bucket. ${error}`);
  }
}
