/**
 * Created by AlexanderC on 2/15/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class TokenDriver extends AbstractDriver {
  /**
   * @param {String|null} token
   */
  constructor(token = null) {
    super();

    this._token = token;
  }

  /**
   * @returns {String|null}
   */
  get token() {
    return this._token;
  }

  /**
   * @param {String|null} token
   */
  set token(token) {
    this._token = token;
  }
}
