/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class MissingMicroserviceException extends Exception {
  /**
   * @param {String} identifier
   */
  constructor(identifier) {
    super(
      `Missing microservice ${identifier}. Please assure you are using right microservice identifier!`
    );
  }
}
