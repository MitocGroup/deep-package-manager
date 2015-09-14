/**
 * Created by mgoria on 7/15/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';

/**
 * Throws on invalid application configuration
 */
export class InvalidConfigException extends Exception {
    /**
     * @param {Array} args
     */
    constructor(...args) {
        super(...args);
    }
}