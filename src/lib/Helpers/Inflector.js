/**
 * Created by CCristi on 5/10/16.
 */

'use strict';

export class Inflector {
  /**
   * @param {String} str
   * @returns {String}
   */
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static lowerCaseFirst(str) {
    return str.charAt(0).toLowerCase() + str.slice(1);
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static pascalCase(str) {
    return str
      .split(/[^a-zA-Z0-9]+/)
      .reduce((pascalString, part) => {
        return pascalString + Inflector.capitalizeFirst(part);
      }, '');
  }

  /**
   * @param {String} str
   * @returns {*}
   */
  static lispCase(str) {
    return str
      .split(/[^a-z0-9\-]+/i)
      .map(s => s.toLowerCase())
      .join('-');
  }
}
