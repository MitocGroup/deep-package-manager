/**
 * Created by CCristi on 07/07/16.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

export class MissingAccountMicroserviceException extends Exception {
  constructor() {
    super('Missing "deep-account" microservice');
  }
}
