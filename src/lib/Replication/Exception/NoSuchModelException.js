/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class NoSuchModelException extends Exception {
  /**
   * @param {String} modelName
   */
  constructor(modelName) {
    super(`Model "${modelName}" was not found.`);
  }
}
