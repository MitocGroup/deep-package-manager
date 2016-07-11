/**
 * Created by CCristi on 6/14/16.
 */

'use strict';

import {HttpDriver} from './HttpDriver';
import {GitHubErrorHandler} from './Helpers/ErrorHandler/GitHubErrorHandler';
import request from 'fetchy-request';

export class GitHubDriver extends HttpDriver {
  constructor() {
    super();
    this._authHeaders = {};
    this._errorHandler = new GitHubErrorHandler(this).extend();
  }

  /**
   * @param {String} username
   * @param {String} token
   * @returns {GitHubDriver}
   */
  auth(username, token) {
    let authHash = new Buffer(`${username}:${token}`).toString('base64');
    let headerValue = `Basic ${authHash}`;

    this._authHeaders = {
      Authorization: headerValue,
    };

    return this;
  }

  /**
   * @param {String} objUrl
   * @param {Function} cb
   */
  readObjStreamed(objUrl, cb) {
    request(this._createPayload(objUrl, 'GET'))
      .then(response => {
        if (!response.ok) {
          cb(response._error || new Error(response.statusText), null);
          return;
        }
        
        return cb(null, response.body);
      })
      .catch(error => {
        cb(error, null);
      });
  }

  /**
   * @returns {null|Object}
   */
  get headers() {
    return Object.assign(this._authHeaders, {
      'Accept': '*/*',
      'User-Agent': `deep-registry-rq-${(new Date()).getTime()}`,
    });
  }
}
