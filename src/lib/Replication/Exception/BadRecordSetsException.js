/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class BadRecordSetsException extends Exception {
  /**
   * @param {String} error
   */
  constructor(error) {
    super(error);
  }
}
