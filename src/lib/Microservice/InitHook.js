/**
 * Created by AlexanderC on 9/15/15.
 */

'use strict';

import FileSystem from 'fs';

export class InitHook {
  /**
   * @param {Instance} microservice
   */
  constructor(microservice) {
    this._microservice = microservice;
  }

  /**
   * @returns {Function}
   */
  getHook() {
    let hookFile = this._getHookFile();

    if (!FileSystem.existsSync(hookFile)) {
      return null;
    }

    let hook = require(hookFile);

    if (typeof hook !== 'function') {
      return null;
    }

    return this._wrap(hook);
  }

  /**
   * @param {Function} hook
   * @returns {Function}
   * @private
   */
  _wrap(hook) {
    return function(cb) {
      hook.bind({
        microservice: this._microservice,
      })(cb);
    }.bind(this);
  }

  /**
   * @returns {String}
   * @private
   */
  _getHookFile() {
    return `${this._microservice.basePath}/${InitHook.HOOK_BASENAME}`;
  }

  /**
   * @returns {String}
   */
  static get HOOK_BASENAME() {
    return 'hook.init.js';
  }
}