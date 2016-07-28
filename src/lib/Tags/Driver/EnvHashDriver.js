/**
 * Created by CCristi on 6/23/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class EnvHashDriver extends AbstractDriver {
  /**
   * @param {String} env
   * @param {String} hash
   */
  constructor(env, hash) {
    super();

    this._env = env;
    this._hash = hash;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    return this.replaceTags(
      htmlContent,
      EnvHashDriver.TAG_SUFFIX,
      `${this._env}-${this._hash}`
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'hash';
  }
}
