/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {Exception} from './Exception';


/**
 * Thrown when an infinite recursion happens
 */
export class InfiniteRecursionException extends Exception {
    /**
     * @param {String} dependencyName
     * @param {String} dependencyVersion
     */
    constructor(dependencyName, dependencyVersion) {
        super(`Infinite recursion: recursive dependency ${dependencyName}@${dependencyVersion}`);
    }
}