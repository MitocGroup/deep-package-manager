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
   * @returns {String}
   */
  static get HOOK_BASENAME() {
    return 'hook.pre-deploy.js';
  }
}
