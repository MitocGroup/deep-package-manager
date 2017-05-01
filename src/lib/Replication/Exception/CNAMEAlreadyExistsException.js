/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class CNAMEAlreadyExistsException extends Exception {
  /**
   * @param {String} cName
   */
  constructor(cName) {
    super(
      `Deepify publish requires "${cName}" CNAME during blue green deployment. ` +
      `Please release it from CloudFront distribution and try again.`
    );
  }
}
