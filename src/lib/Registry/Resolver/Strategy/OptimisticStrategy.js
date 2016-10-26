/**
 * Created by CCristi on 10/26/16.
 */

'use strict';

import {SemVerStrategy} from './SemVerStrategy';

export class OptimisticStrategy extends SemVerStrategy {
  constructor() {
    super();
  }

  /**
   * @param {ModuleDB} moduleDb
   * @param {String} version
   * @returns {String}
   */
  resolve(moduleDb, version) {
    try {
      return super.resolve(moduleDb, version) || version;
    } catch(e) {
      return version;
    }
  }
}
