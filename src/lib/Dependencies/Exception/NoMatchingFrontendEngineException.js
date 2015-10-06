/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {Exception} from './Exception';

export class NoMatchingFrontendEngineException extends Exception {
  /**
   * @param {String[]} engines
   */
  constructor(engines) {
    if (engines.length <= 0) {
      engines.push('----');
    }

    super(`Non of the following frontend engines are suitable: ${engines.join(', ')}`);
  }
}
