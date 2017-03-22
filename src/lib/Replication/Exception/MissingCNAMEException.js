/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class MissingCNAMEException extends Exception {
  constructor() {
    super('You must setup CNAME for your cloudfront distribution to enable blue-green deployment');
  }
}
