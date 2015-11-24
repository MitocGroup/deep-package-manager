/**
 * Created by vcernomschi on 11/24/15.
 */

'use strict';

import {AbstractReplacer} from '../../../../lib.compiled/Assets/Replacer/AbstractReplacer';

export class AbstractReplacerMock extends AbstractReplacer {
  /**
   * @param {String} version
   */
  constructor(version) {
    super(version);
  }

  /**
   * Fake method
   * @param {String} content
   * @param {String} extension
   * @returns {AbstractReplacerMock}
   * @private
   */
  _replace(content, extension) {
    this.isReplaced = true;

    return this;
  }
}
