/**
 * Created by mgoria on 09/11/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class FailedToRetrieveLambdaSubnetGroupException extends Exception {
  /**
   * @param {Error|String} error
   */
  constructor(error) {
    super(`Failed to retrieve Lambda security subnet group: ${error}`);
  }
}
