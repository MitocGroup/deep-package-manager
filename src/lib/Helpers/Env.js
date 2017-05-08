/**
 * Created by vcernomschi on 1/21/16.
 */

'use strict';

export class Env {

  /**
   * @returns {Boolean}
   */
  static get isWin() {
    return /^win/.test(process.platform);
  }
}
