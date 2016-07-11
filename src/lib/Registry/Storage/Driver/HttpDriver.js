/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {DriverObjectNotAllowedException} from './Exception/DriverObjectNotAllowedException';
import {AbstractReadonlyDriver} from './AbstractReadonlyDriver';
import request from 'fetchy-request';

export class HttpDriver extends AbstractReadonlyDriver {
  constructor() {
    super();
  }

  /**
   * @param {String} objUrl
   * @param {Function} cb
   */
  readObj(objUrl, cb) {
    if (!HttpDriver.validateURL(objUrl)) {
      cb(new DriverObjectNotAllowedException(objUrl), null);
      return;
    }

    request(this._createPayload(objUrl, 'GET'))
      .then(response => {
        if (!response.ok) {
          cb(response._error || new Error(response.statusText), null);
          return;
        }

        response
          .text()
          .then(textResponse => {
            cb(null, textResponse);
          })
          .catch(error => {
            cb(error, null);
          });
      })
      .catch(error => {
        cb(error, null);
      });
  }

  /**
   * @param {String} objUrl
   * @param {Function} cb
   */
  hasObj(objUrl, cb) {
    if (!HttpDriver.validateURL(objUrl)) {
      cb(null, false);
      return;
    }

    request(this._createPayload(objUrl, 'HEAD'))
      .then(response => {
        if (!response.ok) {
          if (response.status === 404) {
            cb(null, false);
          } else {
            cb(response._error, null);
          }

          return;
        }

        cb(null, true);
      })
      .catch(e => cb(e, null));
  }

  /**
   * @param {String} url
   * @param {String} method
   * @returns {{uri: *, method: *, headers: Object}}
   * @protected
   */
  _createPayload(url, method) {
    return {
      uri: url,
      method: method,
      headers: this.headers,
    }
  }

  /**
   * @param {String} url
   * @returns {Boolean}
   */
  static validateURL(url) {
    return /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&/=]*)/.test(url);
  }

  /**
   * @returns {Object}
   */
  get headers() {
    return {};
  }
}
