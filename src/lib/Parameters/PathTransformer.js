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
    let keyPrefix = baseKey ? `${baseKey}${this._delimiter}` : '';

    for (let k in obj) {
      if (!obj.hasOwnProperty(k)) {
        continue;
      }

      let value = obj[k];

      if (typeof value === 'object') {
        let nestedResultVector = this._extractKeyVectorAndValue(value, k);

        for (let nk in nestedResultVector) {
          if (!nestedResultVector.hasOwnProperty(nk)) {
            continue;
          }

          let nestedResult = nestedResultVector[nk];

          nestedResult.key = `${keyPrefix}${nestedResult.key}`;

          resultVector.push(nestedResult);
        }
      } else {
        resultVector.push({key: `${keyPrefix}${k}`, value: value});
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
    if (keyVector.length <= 0) {
      return value;
    }

    let obj = {};
    let rootKey = keyVector.shift();

    obj[rootKey] = PathTransformer._embedObject(keyVector, value);

    return obj;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_DELIMITER() {
    return '|';
  }
}
