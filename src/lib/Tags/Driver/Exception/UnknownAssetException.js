/**
 * Created by CCristi <ccovali@mitocgroup.com> on 2/23/16.
 */

'use strict';

import {TagsDriverException} from './TagsDriverException';

/**
 * Unknown Asset Exception
 */
export class UnknownAssetException extends TagsDriverException {
  constructor(file) {
    super(`'${file}' is not supported.`);
  }
}
