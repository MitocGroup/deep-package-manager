/**
 * Created by AlexanderC on 1/6/16.
 */

'use strict';

export class Inflector {

  /**
   * @param {String} type
   * @returns {String}
   */
  static cloudSearchOptionsKey(type) {
    let result = type.replace(/(-[A-Z])/, (s) => s.replace(/(-)/g, '').toLowerCase());
    let firstLetter = result.charAt(0).toUpperCase();

    return `${firstLetter}${result.slice(1)}Options`;
  }

  /**
   * Field names can contain the following characters: a-z (lowercase), 0-9, and _ (underscore).
   * Regular field names must begin with a letter.
   * Dynamic field names must begin or end with a wildcard (*).
   * The wildcard can also be the only character in a dynamic field name.
   * Multiple wildcards and wildcards embedded within a string are not supported.
   *
   * @param {String} rawName
   * @returns {String}
   */
  static cloudSearchFieldName(rawName) {
    let name = Inflector._upperToLowerAndUnderscore(rawName, '_');

    return name.replace(/[^a-z0-9_\*]/, '_');
  }

  /**
   * @param {String} str
   * @param {String} delimiter
   * @returns {String}
   * @private
   */
  static _upperToLowerAndUnderscore(str, delimiter) {
    let result = str.replace(/([A-Z])/, (s) => `${delimiter}${s.toLowerCase()}`);

    if (result.indexOf(delimiter) === 0) {
      result = result.substr(delimiter.length);
    }

    return result;
  }
}
