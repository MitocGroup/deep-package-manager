/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class CNAMEAlreadyExistsException extends Exception {
  /**
   * @param {String} cName
   */
  constructor(cName) {
    super(`CNAME "${cName}" should be available in for blue green deployment.`);
  }
}
