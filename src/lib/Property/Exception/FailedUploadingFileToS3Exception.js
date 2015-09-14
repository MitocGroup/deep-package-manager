/**
 * Created by mgoria on 6/9/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';

/**
 * Throws when file upload to s3 fails
 */
export class FailedUploadingFileToS3Exception extends Exception {
    /**
     * @param {String} fileName
     * @param {String} bucketName
     * @param {String} error
     */
    constructor(fileName, bucketName, error) {
        super(`Error uploading "${fileName}" file to "${bucketName}" bucket. ${error}`);
    }
}