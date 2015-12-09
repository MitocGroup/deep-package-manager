/**
 * Created by AlexanderC on 11/25/15.
 */

'use strict';

import {AbstractMatcher} from './AbstractMatcher';

export class OptimisticMatcher extends AbstractMatcher {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {String} type
   * @param {String} resourceId
   * @returns {Boolean}
   */
  match(type, resourceId) {
    return true;
  }
}
