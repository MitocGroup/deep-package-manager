/**
 * Created by AlexanderC on 6/2/15.
 */

"use strict";

import {Exception} from '../Exception/Exception';
import {WaitFor} from './WaitFor';


/**
 * Synchronous stack for aws requests
 */
export class AwsRequestSyncStack {
    constructor() {
        this._stack = [];
        this._levels = [];
        this._completed = 0;
    }

    /**
     * @returns {Number}
     */
    get levelsDepth() {
        return this._levels.length;
    }

    /**
     * @returns {AwsRequestSyncStack}
     */
    addLevel() {
        let newLevel = new AwsRequestSyncStack();

        this._levels.push(newLevel);

        return newLevel;
    }

    /**
     * @param {Number} level
     * @param {Boolean} strict
     * @returns {AwsRequestSyncStack}
     */
    level(level, strict) {
        // @todo: remove implementing late call...
        if (level > 1) {
            throw new Exception("Avoid using level > 1 until late call is implemented!");
        }

        while (this.levelsDepth < level) {
            if (strict) {
                let depth = this.levelsDepth;

                throw new Exception(`Current levels depth is ${depth}`);
            }

            this.addLevel();
        }

        return this._levels[--level];
    }

    /**
     *
     * @returns {Number}
     */
    get count() {
        return this._stack.length;
    }

    /**
     * @returns {Number}
     */
    get completed() {
        return this._completed;
    }

    /**
     * @returns {Number}
     */
    get remaining() {
        return this._stack.length - this._completed;
    }

    /**
     * @param {Object} request
     * @param {Function} callback
     */
    push(request, callback) {
        request.on('complete', function(response) {
            if (callback) {
                callback(response.error, response.data);
            } else if (response.error) {
                throw new Exception(`Error while executing AWS request: ${response.error}`);
            }

            this._completed++;
        }.bind(this));

        this._stack.push(AwsRequestSyncStack.wrapRequest(request));
    }

    /**
     * @param {Boolean} topOnly
     * @returns {WaitFor}
     */
    join(topOnly = false) {
        for (let request of this._stack) {
            request.send()
        }

        let wait = new WaitFor();

        wait.push(function() {
            if (this.remaining > 0) {
                return false;
            }

            this._completed = 0;
            this._stack = [];

            if (!topOnly) {
                for (let childStack of this._levels) {
                    wait.addChild(childStack.join());
                }
            }

            return true;
        }.bind(this));

        return wait;
    }

    /**
     * @param {Object} request
     * @return {Object}
     */
    static wrapRequest(request) {
        return new function() {
            var response;

            return {
                native: function() {
                    return request;
                },
                response: function() {
                    return response;
                },
                sent: function() {
                    return !!response;
                },
                send: function() {
                    return response || (response = request.send());
                }
            };
        };
    }
}