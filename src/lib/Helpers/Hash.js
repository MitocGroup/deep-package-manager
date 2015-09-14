/**
 * Created by AlexanderC on 6/9/15.
 */

'use strict';

import Crypto from 'crypto';
import Crc from 'crc';

/**
 * Hashing helper
 */
export class Hash {
  /**
   * @param {*} data
   * @returns {String}
   */
  static crc32(data) {
    return Crc.crc32(data).toString(16);
  }

  /**
   * @param {*} data
   * @returns {String}
   */
  static sha1(data) {
    return Hash.create(data, 'sha1');
  }

  /**
   * @param {*} data
   * @returns {String}
   */
  static md5(data) {
    return Hash.create(data, 'md5');
  }

  /**
   * @returns {String}
   */
  static pseudoRandomId(obj = null) {
    return Hash
      .md5(obj.toString() + Math.random().toString());
  }

  /**
   * @param {*} data
   * @param {String} algo
   * @returns {String}
   */
  static create(data, algo) {
    return Crypto
      .createHash(algo)
      .update(data)
      .digest('hex');
  }
}
