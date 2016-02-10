/**
 * Created by AlexanderC on 6/3/15.
 */

'use strict';

import {InvalidArgumentException} from '../Exception/InvalidArgumentException';

/**
 * Wait for something
 */
export class WaitFor {
  constructor() {
    this._stack = [];
    this._toSkip = [];
  }

  /**
   * @returns {Number}
   */
  get count() {
    return this._stack.length;
  }

  /**
   * @returns {Number}
   */
  get remaining() {
    return this._stack.length - this._toSkip.length;
  }

  /**
   * @param {Function} condition
   * @returns {WaitFor}
   */
  push(condition) {
    if (!(condition instanceof Function)) {
      throw new InvalidArgumentException(condition, 'Function');
    }

    this._stack.push(condition);

    return this;
  }

  /**
   * @param {Function} callback
   */
  ready(callback) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    let skipStack = [];

    for (let i = 0; i < this.count; i++) {
      let condition = this._stack[i];

      if (condition()) {
        this._toSkip.push(condition);
        skipStack.push(i);
      }
    }

    for (let i in skipStack) {
      if (!skipStack.hasOwnProperty(i)) {
        continue;
      }

      delete this._stack[skipStack[i]];
    }

    if (this.remaining > 0) {
      setTimeout(() => {
        this.ready(callback);
      }, WaitFor.TICK_TTL);
    } else {
      callback();
    }
  }

  /**
   * @returns {Number}
   */
  static get TICK_TTL() {
    return 100;
  }
}
