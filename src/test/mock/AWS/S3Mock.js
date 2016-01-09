/**
 * Created by vcernomschi on 1/5/16.
 */
'use strict';

export class S3Mock {
  constructor(mode = S3Mock.NO_RESULT_MODE, methods = S3Mock.METHODS) {
    this._methodsBehavior = new Map();

    //set data mode as initial values
    this.setMode(S3Mock.DATA_MODE);

    //set mode based on args
    this.setMode(mode, methods);
  }

  /**
   * Returns callback for method based on behavior from _methodsBehavior map
   * @param {String} mode
   * @param {Function} callback
   */
  getCallbackByMode(mode, callback) {
    switch (mode) {
      case S3Mock.NO_RESULT_MODE:
        callback(null);
        break;

      case S3Mock.FAILURE_MODE:
        callback(S3Mock.ERROR);
        break;

      case S3Mock.DATA_MODE:
        callback(S3Mock.DATA);
        break;
    }
  }

  /**
   * @param {String} event
   * @param {Function} callback
   * @returns {S3Mock}
   */
  on(event, callback) {
    this.getCallbackByMode(this._methodsBehavior.get('on'), callback);

    return this;
  }

  /**
   * @param {String} parameters
   * @returns {S3Mock}
   */
  getObject(parameters) {
    this.parameters = parameters;

    return this;
  }

  /**
   * @param {String} parameters
   * @returns {S3Mock}
   */
  putObject(parameters) {
    this.parameters = parameters;

    return this;
  }

  /**
   * @returns {S3Mock}
   */
  send() {
    return this;
  }

  /**
   * Set mode for passed methods
   * @param {Number} mode
   * @param {String[]} methods
   */
  setMode(mode = S3Mock.NO_RESULT_MODE, methods = S3Mock.METHODS) {

    if (S3Mock.MODES.indexOf(mode) < 0) {
      mode = S3Mock.NO_RESULT_MODE;
    }

    for (let method of methods) {
      if (S3Mock.METHODS.indexOf(method) < 0) {
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
      S3Mock.NO_RESULT_MODE,
      S3Mock.FAILURE_MODE,
      S3Mock.DATA_MODE,
    ];
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get ERROR() {
    return {
      code: 500,
      error: {message: 'RuntimeException'},
    };
  }

  /**
   * @returns {string}
   * @constructor
   */
  static get DATA() {
    return {
      code: 200,
      data: 'Test data response',
    };
  }

  /**
   * @returns {string[]}
   * @constructor
   */
  static get METHODS() {
    return [
      'on',
    ];
  }
}
