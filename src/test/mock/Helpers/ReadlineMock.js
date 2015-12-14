/**
 * Created by vcernomschi on 12/14/15.
 */

'use strict';

/**
 * ReadlineMock
 */

export class ReadlineMock {
  constructor() {
    this._methodsBehavior = new Map();
    this.setMode(ReadlineMock.NO_RESULT_MODE);
  }

  /**
   * Returns result for method based on behavior from _methodsBehavior map
   * @param {String} mode
   * @param {Function} callback
   */
  getResultByMode(mode, callback) {
    switch (mode) {
      case ReadlineMock.NO_RESULT_MODE:
        callback(null);
        break;

      case ReadlineMock.FAILURE_MODE:
        callback(ReadlineMock.ERROR);
        break;

      case ReadlineMock.DATA_MODE:
        callback(ReadlineMock.DATA);
        break;
    }
  }

  /**
   * @param {String} text
   * @param {Function} callback
   * @returns {ReadlineMock}
   */
  question(text, callback) {
    console.log('in mock question');
    this.getResultByMode(this._methodsBehavior.get('question'), callback);

    return this;
  }

  /**
   * @param {String} text
   * @param {Function} callback
   * @returns {ReadlineMock}
   */
  questionHidden(text, callback) {
    this.getResultByMode(this._methodsBehavior.get('questionHidden'), callback);

    return this;
  }

  /**
   * @returns {ReadlineMock}
   */
  close() {
    return this;
  }


  /**
   * Set mode for passed methods
   * @param {Number} mode
   * @param {String[]} methods
   */
  setMode(mode = ReadlineMock.NO_RESULT_MODE, methods = ReadlineMock.METHODS) {

    if (ReadlineMock.MODES.indexOf(mode) < 0) {
      mode = ReadlineMock.NO_RESULT_MODE;
    }

    for (let method of methods) {
      if (ReadlineMock.METHODS.indexOf(method) < 0) {
        continue;
      }

      this._methodsBehavior.set(method, mode);
    }
  }

  /**
   * @returns {number}
   * @constructor
   */
  static get NO_RESULT_MODE() {
    return 0;
  }

  /**
   * @returns {number}
   * @constructor
   */
  static get FAILURE_MODE() {
    return 1;
  }

  /**
   * @returns {number}
   * @constructor
   */
  static get DATA_MODE() {
    return 2;
  }

  /**
   * @returns {string[]}
   * @constructor
   */
  static get MODES() {
    return [
      ReadlineMock.NO_RESULT_MODE,
      ReadlineMock.FAILURE_MODE,
      ReadlineMock.DATA_MODE,
    ];
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get ERROR() {
    return {
      code: 500,
      message: 'Internal Error',
    };
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get DATA() {
    return  'Question successfully processed';
  }

  /**
   * @returns {string[]}
   * @constructor
   */
  static get METHODS() {
    return [
      'question',
      'questionHidden',
    ];
  }
}
