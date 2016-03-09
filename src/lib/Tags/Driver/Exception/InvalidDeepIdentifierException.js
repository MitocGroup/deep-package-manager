'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * Thrown when trying to parse an invalid deep identifier
 */
export class InvalidDeepIdentifierException extends TagsDriverException {
  /**
   * @param {String} identifier
   */
  constructor(identifier) {
    super(`Invalid deep identifier "${identifier}". It should conform to the following format: @microservice_identifier:resource_identifier.`);
  }
}
