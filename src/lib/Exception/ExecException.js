/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from './Exception';

/**
 * throws when shell execution fails
 */
export class ExecException extends Exception {
    /**
     * @param {Number} status
     * @param {String} stderr
     */
    constructor(status, stderr) {
        super(`Shell execution failed with status ${status} (${stderr})`);
    }
}