/**
 * Created by AlexanderC on 11/17/15.
 */

'use strict';

import {AbstractReplacer} from './Replacer/AbstractReplacer';
import Core from 'deep-core';
import fs from 'fs';
import path from 'path';

export class AssetReplacer {
  /**
   * @param {String} version
   */
  constructor(version) {
    this._version = version;
    this._replacers = [];
  }

  /**
   * @param {String} version
   * @param {String|AbstractReplacer|*} replacers
   */
  static create(version, ...replacers) {
    let self = new AssetReplacer(version);

    replacers.forEach((replacer) => {
      self.addReplacer(replacer);
    });

    return self;
  }

  /**
   * @param {String|*} files
   * @returns {AssetReplacer}
   */
  replace(...files) {
    files.forEach((file) => {
      let extension = AssetReplacer._getExtension(file);
      let content = fs.readFileSync(file).toString();

      this._replacers.forEach((replacer) => {
        content = replacer.replace(content, extension);
      });

      fs.writeFileSync(file, content);
    });

    return this;
  }

  /**
   * @param {String} file
   * @returns {String}
   * @private
   */
  static _getExtension(file) {
    return path.extname(file).substr(1).toLowerCase();
  }

  /**
   * @param {String|AbstractReplacer} replacer
   * @returns {AssetReplacer}
   */
  addReplacer(replacer) {
    if (typeof replacer === 'string') {
      let replacerName = `${AssetReplacer._ucFirst(replacer)}Replacer`;
      let ReplacerProto = require(`./Replacer/${replacerName}`)[replacerName];

      replacer = new ReplacerProto(this._version);
    }

    if (!(replacer instanceof AbstractReplacer)) {
      throw new Core.Exception.InvalidArgumentException(replacer, 'AbstractReplacer');
    }

    this._replacers.push(replacer);

    return this;
  }

  /**
   * @returns {AbstractReplacer[]}
   */
  get replacers() {
    return this._replacers;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {String} str
   * @returns {String}
   * @private
   */
  static _ucFirst(str) {
    return str[0].toUpperCase() + str.slice(1);
  }
}