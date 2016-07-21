/**
 * Created by AlexanderC on 12/16/15.
 */

'use strict';

import {Hash} from './Hash';

export class DeployID {
  /**
   * @param {Property|*} property
   */
  constructor(property) {
    this._property = property;
  }

  /**
   * @returns {Property|*}
   */
  get property() {
    return this._property;
  }

  /**
   * @param {String} algo
   * @returns {String}
   */
  toString(algo = 'crc32') {
    switch(algo) {
    case 'md5':
    case 'sha1':
    case 'crc32':
      return Hash[algo](this._rawId);
    default: throw new Error('Unknown deployId generation algorithm');
    }
  }

  /**
   * @returns {String}
   * @private
   */
  get _rawId() {
    return `${this._property.identifier}#${new Date().getTime()}`;
  }
}
