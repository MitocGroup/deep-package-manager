/**
 * Created by AlexanderC on 11/17/15.
 */

'use strict';

import Core from 'deep-core';

export class AbstractReplacer extends Core.OOP.Interface {
  /**
   * @param {String} version
   */
  constructor(version) {
    super(['_replace']);

    this._version = version;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {String} content
   * @param {String} extension
   * @returns {String}
   */
  replace(content, extension) {
    return this._replace(content, extension);
  }
}
