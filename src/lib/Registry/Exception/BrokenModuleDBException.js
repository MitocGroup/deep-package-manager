/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class BrokenModuleDBException extends Exception {
  constructor() {
    super('Unable to decode module DB file');
  }
}