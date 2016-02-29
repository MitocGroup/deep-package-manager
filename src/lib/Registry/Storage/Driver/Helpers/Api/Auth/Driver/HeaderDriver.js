/**
 * Created by AlexanderC on 2/15/16.
 */

'use strict';

import {TokenDriver} from './TokenDriver';

export class HeaderDriver extends TokenDriver {
  /**
   * @param {String|*} args
   */
  constructor(...args) {
    super(...args);

    this._headerName = HeaderDriver.DEFAULT_HEADER_NAME;
  }

  /**
   * @returns {String}
   */
  get headerName() {
    return this._headerName;
  }

  /**
   * @param {String} name
   */
  set headerName(name) {
    this._headerName = name;
  }

  /**
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Function} cb
   */
  authorize(request, cb) {
    let headerName = HeaderDriver.DEFAULT_HEADER_NAME.toLowerCase();

    if (!request.headers.hasOwnProperty(headerName)) {
      cb(new Error(`Missing authorization header '${HeaderDriver.DEFAULT_HEADER_NAME}'`));
      return;
    }

    let token = request.headers[headerName];

    cb(token === this.token ? null : new Error('Authorization token doesn\'t match'));
  }

  /**
   * @param {Object|*} payload
   */
  injectIntoRequest(payload) {
    payload.headers = payload.headers || {};
    payload.headers[this._headerName] = this.token;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_HEADER_NAME() {
    return 'Auth';
  }
}
