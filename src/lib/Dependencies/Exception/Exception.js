/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {Exception as BaseException} from '../../Exception/Exception';


/**
 * Thrown when an dependency management exception occurred
 */
export class Exception extends BaseException {
    /**
     * @param {Array} args
     */
   constructor(...args) {
       super(...args);
   }
}