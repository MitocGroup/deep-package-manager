/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

import objectMerge from 'object-merge';

export class PathTransformer {
  /**
   * @param {String} delimiter
   */
  constructor(delimiter = PathTransformer.DEFAULT_DELIMITER) {
    this._delimiter = delimiter;
  }

  /**
   * @param {Object} obj
   * @returns {Object}
   */
  plainify(obj) {
    let rawObj = {};

    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) {
        continue;
      }

      let value = obj[key];

      if (typeof value === 'object') {
        let valueObjVector = this._extractKeyVectorAndValue(value);

        for (let i in valueObjVector) {
          if (!valueObjVector.hasOwnProperty(i)) {
            continue;
          }

          let valueObj = valueObjVector[i];

          rawObj[`${key}${this._delimiter}${valueObj.key}`] = valueObj.value;
        }
      } else {
        rawObj[key] = value;
      }
    }

    return rawObj;
  }

  /**
   * @param {Object} obj
   * @param {String} baseKey
   * @returns {Object[]}
   * @private
   */
  _extractKeyVectorAndValue(obj, baseKey = '') {
    let resultVector = [];

    for (let i in obj) {
      if (!obj.hasOwnProperty(i)) {
        continue;
      }

      let value = obj[i];

      if (typeof value === 'object') {
        resultVector = resultVector.concat(this._extractKeyVectorAndValue(value, i));
      } else {
        let prefix = baseKey ? `${baseKey}${this._delimiter}` : '';

        resultVector.push({key: `${prefix}${i}`, value: value});
      }
    }

    return resultVector;
  }

  /**
   * @param {Object} rawObj
   * @returns {Object}
   */
  transform(rawObj) {
    let obj = {};

    for (let key in rawObj) {
      if (!rawObj.hasOwnProperty(key)) {
        continue;
      }

      let value = rawObj[key];

      if (typeof value === 'undefined' || value === null) {
        continue;
      }

      let keyVector = key.split(this._delimiter);

      if (keyVector.length === 1) {
        obj[key] = value;
        continue;
      }

      let rootKey = keyVector.shift();

      obj[rootKey] = objectMerge(obj[rootKey] || {}, PathTransformer._embedObject(keyVector, value));
    }

    return obj;
  }

  /**
   * @param {String[]} keyVector
   * @param {*} value
   * @returns {Object}
   * @private
   */
  static _embedObject(keyVector, value) {
    let obj = {};
    let rootKey = keyVector.shift();

    obj[rootKey] = keyVector.length <= 0 ? value : PathTransformer._embedObject(keyVector, value);

    return obj;
  }

  static get DEFAULT_DELIMITER() {
    return '|';
  }
}
