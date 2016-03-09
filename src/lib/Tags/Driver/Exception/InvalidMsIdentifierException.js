'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * Invalid identifier exception
 */
export class InvalidMsIdentifierException extends TagsDriverException {
  /**
   *
   * @param {String} identifier
   */
  constructor(identifier) {
    super(`Microservice with ${identifier} doesn't exist.`);
  }
}
