/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class MissingCloudFrontEventTypeException extends Exception {
  /**
   * @param {String} eventType
   */
  constructor(eventType) {
    super(`Missing "${eventType}" cloudfront event type.`);
  }
}
