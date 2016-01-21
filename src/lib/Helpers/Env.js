/**
 * Created by vcernomschi on 1/21/16.
 */

export class Env {

  /**
   * @returns {Boolean}
   * @private
   */
  static get isWin() {
    return /^win/.test(process.platform);
  }
}