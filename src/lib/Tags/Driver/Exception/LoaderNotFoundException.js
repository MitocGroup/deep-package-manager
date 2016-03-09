'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * File Not Found Exception
 */
export class LoaderNotFoundException extends TagsDriverException {
  /**
   *
   * @param {String} file
   */
  constructor(file) {
    super(`Missing loader source file '${file}'`);
  }
}
