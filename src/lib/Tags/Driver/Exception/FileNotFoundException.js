'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * File Not Found Exception
 */
export class FileNotFoundException extends TagsDriverException {
  /**
   *
   * @param {String} file
   */
  constructor(file) {
    super(`File not found: '${file}'`);
  }
}
