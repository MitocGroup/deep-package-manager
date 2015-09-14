/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from '../../../Exception/Exception';

/**
 * throws when bucket creation failed
 */
export class FailedToCreateBucketException extends Exception {
    /**
     * @param {String} bucketName
     * @param {String} error
     */
    constructor(bucketName, error) {
        super(`Error on creating "${bucketName}" bucket. ${error}`);
    }
}