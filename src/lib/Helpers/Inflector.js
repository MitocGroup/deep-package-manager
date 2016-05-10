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
  
  static pascalCase(string) {
    return string
      .split(/[^a-zA-Z0-9]+/)
      .reduce((pascalString, part) => {
        return pascalString + Inflector.capitalizeFirst(part);
      }, '');
  }
}
