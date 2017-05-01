/**
 * Created by CCristi on 8/30/16.
 */

'use strict';

import {InitHook} from './InitHook';

export class PostInstallHook extends InitHook {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} hook
   * @returns {Function}
   * @private
   */
  _wrap(hook) {
    return (cb) => {
      hook.bind({
        microservice: this._microservice,
      })(cb);
    };
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'PostInstallHook';
  }

  /**
   * @param {Property} property
   * @returns {Array}
   */
  static getBindingParameters(property) {
    return [];
  }

  /**
   * @returns {String}
   */
  static get HOOK_BASENAME() {
    return 'hook.post-install.js';
  }
}
