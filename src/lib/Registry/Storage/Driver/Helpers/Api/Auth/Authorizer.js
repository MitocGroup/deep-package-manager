/**
 * Created by AlexanderC on 2/15/16.
 */

'use strict';

import {HeaderDriver} from './Driver/HeaderDriver';

export class Authorizer {
  /**
   * @param {AbstractDriver|TokenDriver|HeaderDriver|*} driver
   */
  constructor(driver) {
    this._driver = driver;
  }

  /**
   * @param {String} token
   * @returns {Authorizer}
   */
  static createHeaderToken(token) {
    return new Authorizer(new HeaderDriver(token));
  }

  /**
   * @returns {AbstractDriver|TokenDriver|HeaderDriver|*}
   */
  get driver() {
    return this._driver;
  }

  /**
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Function} cb
   */
  authorize(request, cb) {
    this._driver.authorize(request, cb);
  }

  /**
   * @param {Object|*} payload
   */
  injectIntoRequest(payload) {
    this._driver.injectIntoRequest(payload);
  }
}
