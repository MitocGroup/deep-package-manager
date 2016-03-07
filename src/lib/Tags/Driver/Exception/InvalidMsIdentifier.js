'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * Invalid identifier exception
 */
export class InvalidMsIdentifier extends TagsDriverException {
  constructor(identifier) {
    super(`Microservice with ${identifier} doesn't exist.`);
  }
}
