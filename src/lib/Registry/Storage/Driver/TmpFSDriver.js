/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {FSDriver} from './FSDriver';
import os from 'os';

export class TmpFSDriver extends FSDriver {
  constructor() {
    super(os.tmpdir());
  }
}
