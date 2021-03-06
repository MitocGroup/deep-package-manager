/**
 * Created by AlexanderC on 9/15/15.
 */

'use strict';

import FileSystem from 'fs';
import path from 'path';

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
    return (cb) => {
      hook.bind({
        microservice: this._microservice,
      })(cb);
    };
  }

  /**
   * @returns {String}
   * @private
   */
  _getHookFile() {
    return path.join(this._microservice.basePath, this.constructor.HOOK_BASENAME);
  }

  /**
   * @returns {String}
   */
  static get NAME() {
    return 'InitHook';
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
    return 'hook.init.js';
  }
}
