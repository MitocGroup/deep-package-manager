/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Core from '@mitocgroup/deep-core';

/**
 * Abstract package compiler
 */
export class AbstractCompiler extends Core.OOP.Interface {
  constructor() {
    super(['compile']);
  }
}
