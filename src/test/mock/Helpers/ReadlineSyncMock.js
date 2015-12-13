/**
 * Created by vcernomschi on 12/11/15.
 */

'use strict';

/**
 * ReadlineSyncMock
 */

export class ReadlineSyncMock {
  constructor() {
    this._methodsBehavior = new Map();
    this.setMode(ReadlineSyncMock.NO_RESULT_MODE);
  }

  /**
   * Returns result for method based on behavior from _methodsBehavior map
   * @param {String} mode
   * @param {Function} callback
   */
  getResultByMode(mode, callback) {
    switch (mode) {
      case ReadlineSyncMock.NO_RESULT_MODE:
        callback(null);
        break;

      case ReadlineSyncMock.FAILURE_MODE:
        callback(ReadlineSyncMock.ERROR);
        break;

      case ReadlineSyncMock.DATA_MODE:
        callback(ReadlineSyncMock.ERROR);
        break;
    }
  }

  /**
   * @param {String} text
   * @param {Function} callback
   * @returns {ReadlineSyncMock}
   */
  question(text, callback) {
    this.getResultByMode(this._methodsBehavior.get('question'));

    return this;
  }

  /**
   * @param {String} text
   * @param {Function} callback
   * @returns {ReadlineSyncMock}
   */
  questionHidden(text, callback) {
    this.getResultByMode(this._methodsBehavior.get('questionHidden'));

    return this;
  }


  /**
   * Set mode for passed methods
   * @param {Number} mode
   * @param {String[]} methods
   */
  setMode(mode = ReadlineSyncMock.NO_RESULT_MODE, methods = ReadlineSyncMock.METHODS) {

    if (ReadlineSyncMock.MODES.indexOf(mode) < 0) {
      mode = ReadlineSyncMock.NO_RESULT_MODE;
    }

    for (let method of methods) {
      if (ReadlineSyncMock.METHODS.indexOf(method) < 0) {
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
      ReadlineSyncMock.NO_RESULT_MODE,
      ReadlineSyncMock.FAILURE_MODE,
      ReadlineSyncMock.DATA_MODE,
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
    return {
      status: 200,
      message: 'Question successfully processed',
    };
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
