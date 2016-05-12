/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractStrategy extends Core.OOP.Interface {
  /**
   * @param {String} dumpPath
   */
  constructor(dumpPath) {
    super(['extract']);

    this._dumpPath = dumpPath;
  }

  /**
   * @returns {String}
   */
  get dumpPath() {
    return this._dumpPath;
  }
}
