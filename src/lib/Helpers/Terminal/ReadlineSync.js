/**
 * Created by AlexanderC on 11/18/15.
 */

'use strict';

import readlineSync from 'readline-sync';

export class ReadlineSync {
  /**
   * @param {Object} options
   */
  constructor(options = {}) {
    this._options = options;
  }

  /**
   * @todo: remove this?
   *
   * @returns {Object}
   */
  get options() {
    return this._options;
  }

  /**
   * @param {Object} options
   * @returns {ReadlineSync|*}
   */
  static createInterface(options = {}) {
    return new this(options);
  }

  /**
   * @param {String} text
   * @param {Function} cb
   */
  questionHidden(text, cb = () => {}) {
    cb(readlineSync.question(text, {
      hideEchoBack: true,
    }));
  }

  /**
   * @param {String} text
   * @param {Function} cb
   */
  question(text, cb = () => {}) {
    cb(readlineSync.question(text));
  }

  /**
   * rlInterface compatibility
   */
  on() {
  }

  /**
   * rlInterface compatibility
   */
  close() {
  }
}