/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import Core from 'deep-core';

export class AbstractDriver extends Core.OOP.Interface {
  constructor() {
    super(['inject']);
  }

  /**
   * @param {String} htmlContent
   * @param {String} tagSuffix
   * @param {String} replacement
   * @param {String} tagPrefix
   * @returns {String}
   */
  replaceTags(htmlContent, tagSuffix, replacement, tagPrefix = AbstractDriver.TAG_PREFIX) {
    return htmlContent.replace(
      new RegExp(`<\s*${tagPrefix}-${tagSuffix}\s*/?\s*>`, 'gi'),
      replacement.toString()
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_PREFIX() {
    return 'deep';
  }
}
