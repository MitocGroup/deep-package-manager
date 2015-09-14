/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';

/**
 * throws when lambda upload failed
 */
export class FailedLambdaUploadException extends Exception {
    /**
     * @param {Lambda} lambda
     * @param {String} error
     */
    constructor(lambda, error) {
        let identifier = lambda.identifier;

        super(`Failed to upload lambda ${identifier}: ${error}`);
    }
}