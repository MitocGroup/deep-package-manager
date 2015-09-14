/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

import {Exception} from '../../Exception/Exception';

/**
 * throws when missing property root
 */
export class MissingRootException extends Exception {
    constructor() {
        super('Missing property root');
    }
}