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
   * The simplest "lose lose" algo
   * with small improvements for
   * a smaller hash
   *
   * @todo: test collisions using "birthday paradox"
   *
   * @param {String} str
   * @returns {String}
   */
  static loseLoseMod(str){
    let hash = 0;
    let len = str.length;

    if (len <= 0) {
      return hash.toString();
    }

    for (let i = 0; i < len; i++) {
      hash += str.charCodeAt(i);
    }

    // here's where modification starts
    hash /= (str.charCodeAt(0) - str.charCodeAt(len - 1));
    hash = Math.ceil(hash);

    return hash < 0
      ? `0${Math.abs(hash)}`
      : hash.toString();
  }

  /**
   * @param {String} str
   * @param {Number} length
   * @param {String} char
   * @returns {String}
   * @private
   */
  static _pad(str, length, char = ' ') {
    let padding = (new Array( Math.max(length - str.length + 1, 0))).join(char);

    return `${str}${padding}`;
  }

  /**
   * @param {*} data
   * @returns {String}
   */
  static crc32(data) {
    return Hash._pad(Crc.crc32(data).toString(16), 8, '0');
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
   *
   * @param {String} obj
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
