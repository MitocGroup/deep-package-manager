/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class InvalidUrlException extends Exception {
  /**
   * @param {String} brokenUrl
   */
  constructor(brokenUrl) {
    super(`Broken "${brokenUrl}" URL.`);
  }
}
