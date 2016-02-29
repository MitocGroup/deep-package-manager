/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import {TagsDriverException} from './TagsDriverException';

export class InvalidGTMContainerIdException extends TagsDriverException {
  /**
   * @param {String} containerId
   */
  constructor(containerId) {
    super(`Invalid container ID given. '${containerId}' should match '/^GTM\-[A-Z0-9]+$/i' regular expression`);
  }
}
