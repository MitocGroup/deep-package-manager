/**
 * Created by CCristi on 7/11/16.
 */

'use strict';

import {ComplexDriver} from '../../ComplexDriver';
import {GitHubRateExceededException} from './Exception/GitHubRateExceededException';

export class GitHubErrorHandler {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    this._driver = driver;
  }

  /**
   * @returns {GitHubErrorHandler}
   */
  extend() {
    GitHubErrorHandler.METHODS.forEach(method => {
      let originalMethod = this._driver[method];

      this._driver[method] = (...args) => {
        let originalCallback = args.pop();

        originalMethod.call(this._driver, ...args, (error, response) => {
          if (!error) {
            originalCallback(null, response);
            return;
          }

          originalCallback(this._mapError(error), response);
        });
      }
    });

    return this;
  }

  /**
   * @param {Object} error
   * @returns {Object}
   * @private
   */
  _mapError(error) {
    let errorHeaders = error.response.headers;

    if (
      errorHeaders.hasOwnProperty('x-ratelimit-remaining') &&
      parseInt(errorHeaders['x-ratelimit-remaining']) === 0
    ) {
      return new GitHubRateExceededException();
    }

    return error;
  }

  /**
   * @returns {String[]}
   */
  static get METHODS() {
    return ComplexDriver.READ_METHODS;
  }
}
