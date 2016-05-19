/**
 * Created by CCristi on 5/18/16.
 */

'use strict';

import {InitHook} from './InitHook';

export class PreDeployHook extends InitHook {
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
        deep_package_manager: require('../bootstrap'), // @todo: remove this?
      })(cb);
    };
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
    return 'hook.pre-deploy.js';
  }
}
