'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * File Not Found Exception
 */
export class FileNotFound extends TagsDriverException {
  constructor(file) {
    super(`'${file}' is not found.`);
  }
}
