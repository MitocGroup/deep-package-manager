/**
 * Created by CCristi on 3/6/17.
 */

'use strict';

import JSZip from 'jszip';
import URL from 'url';
import {InvalidUrlException} from '../../Exception/InvalidUrlException';

export class LambdaCompiler {
  /**
   * @param {Buffer} buffer
   */
  constructor(buffer) {
    this._buffer = buffer;
    this._variablesMap = {};
  }

  /**
   * @returns {Promise<Buffer>}
   */
  compile() {
    let jsZip = new JSZip();
    let entriesToCompile = Object.keys(this._variablesMap);

    return jsZip.loadAsync(this._buffer)
      .then(zip => {
        return Promise.all(
          entriesToCompile.map(entryName => {
            return this._compileEntry(zip, entryName);
          })
        ).then(() => zip.generateAsync({
          type: 'nodebuffer',
        }));
      });
  }

  /**
   * @param {JSZip} zip
   * @param {String} entryName
   * @returns {Promise}
   * @private
   */
  _compileEntry(zip, entryName) {
    let entryVariables = this._variablesMap[entryName];

    return zip.file(entryName).async('string').then(entryContent => {
      for (let key in entryVariables) {
        if (!entryVariables.hasOwnProperty(key)) {
          continue;
        }

        let value = entryVariables[key];

        entryContent = entryContent.replace(
          this._buildReplaceRegExp(key),
          value
        );
      }

      zip.file(entryName, entryContent);
    });
  }

  /**
   * Regexp for replacing [placeholders]
   * @param key
   * @returns {RegExp}
   * @private
   */
  _buildReplaceRegExp(key) {
    let escapedKey = key.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

    return new RegExp('\\[' + escapedKey + '\\]', 'gi');
  }

  /**
   * @param {String} key
   * @param {String} value
   * @param {String} entry
   * @returns {LambdaCompiler}
   */
  addVariable(key, value, entry = 'bootstrap.js') {
    this._variablesMap[entry] = this._variablesMap[entry] || {};
    this._variablesMap[entry][key] = value;

    return this;
  }

  /**
   * @param {String} url
   * @returns {Promise}
   */
  static fetchFromUrl(url) {
    let protocol = URL.parse(url).protocol;
    let fetchLib;

    try {
      fetchLib = require(protocol.slice(0, -1));
    } catch(e) {
      return Promise.reject(new InvalidUrlException(url));
    }

    return new Promise((resolve, reject) => {
      let chunks = [];

      fetchLib.get(url, stream => {
        stream.on('data', chunk => chunks.push(chunk));
        stream.on('end', () => {
          let buffer = Buffer.concat(chunks);

          resolve(new LambdaCompiler(buffer));
        })
      }).on('error', reject);
    });
  }
}
