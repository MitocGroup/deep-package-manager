/**
 * Created by AlexanderC on 9/15/15.
 */

'use strict';

import FileSystem from 'fs';
import path from 'path';

export class PostDeployHook {
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
    return (provisioning, isUpdate, cb) => {
      hook.bind({
        microservice: this._microservice,
        provisioning: provisioning,
        isUpdate: isUpdate,
      })(cb);
    };
  }

  /**
   * @returns {String}
   * @private
   */
  _getHookFile() {
    return path.join(this._microservice.basePath, PostDeployHook.HOOK_BASENAME);
  }

  /**
   * @returns {String}
   */
  static get HOOK_BASENAME() {
    return 'hook.post-deploy.js';
  }
}