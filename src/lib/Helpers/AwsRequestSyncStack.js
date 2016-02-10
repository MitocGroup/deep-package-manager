/**
 * Created by AlexanderC on 6/2/15.
 */

'use strict';

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
    this._joinTimeout = 0;
  }

  /**
   * @returns {Number}
   */
  get joinTimeout() {
    return this._joinTimeout;
  }

  /**
   * @param {Number} timeout
   */
  set joinTimeout(timeout) {
    this._joinTimeout = timeout;
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
  level(level, strict = false) {
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
    request.on('complete', (response) => {
      if (callback) {
        callback(response.error, response.data);
      } else if (response.error) {
        throw new Exception(`Error while executing AWS request: ${response.error}`);
      }

      this._completed++;
    });

    this._stack.push(AwsRequestSyncStack.wrapRequest(request));
  }

  /**
   * @param {Boolean} topOnly
   * @returns {WaitFor}
   */
  join(topOnly = false) {
    setTimeout(() => {
      for (let i in this._stack) {
        if (!this._stack.hasOwnProperty(i)) {
          continue;
        }

        this._stack[i].send();
      }
    }, this._joinTimeout);

    let wait = new WaitFor();
    let waitChildren = false;
    let triggerMainReady = false;

    wait.push(() => {
      if (this.remaining > 0 || waitChildren) {
        return false;
      } else if (triggerMainReady) {
        return true;
      }

      this._completed = 0;
      this._stack = [];

      if (!topOnly && this.levelsDepth > 0) {
        waitChildren = true;

        this._waitChildren(0, () => {
          waitChildren = false;
          triggerMainReady = true;
        });

        return false;
      }

      return true;
    });

    return wait;
  }

  /**
   * @param {Number} level
   * @param {Function} cb
   * @private
   */
  _waitChildren(level, cb) {
    if (level >= this.levelsDepth) {
      cb();
      return;
    }

    let subStack = this._levels[level];

    subStack.join().ready(() => {
      this._waitChildren(level + 1, cb);
    });
  }

  /**
   * @param {Object} request
   * @return {Object}
   */
  static wrapRequest(request) {
    return new function() {
      let response = null;

      return {
        native: () => {
          return request;
        },
        response: () => {
          return response;
        },
        sent: () => {
          return !!response;
        },
        send: () => {
          return response || (response = request.send());
        }
      };
    };
  }
}
