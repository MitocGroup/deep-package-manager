/**
 * Created by CCristi on 3/6/17.
 */

'use strict';

import JSZip from 'jszip';
import URL from 'url';
import {InvalidUrlException} from '../../Exception/InvalidUrlException';
import {Inflector} from '../../../Helpers/Inflector';

export class LambdaCompiler {
  /**
   * @param {Buffer} buffer
   */
  constructor(buffer) {
    this._buffer = buffer;
    this._parametersBag = {};
  }

  /**
   * @param {Object} parameters
   * @param {String} parametersGroupId
   * @param {String} entry
   * @returns {LambdaCompiler}
   */
  addParameterBag(
    parameters,
    parametersGroupId = LambdaCompiler.DEFAULT_PARAMETERS_GROUP_ID,
    entry = LambdaCompiler.DEFAULT_ENTRY
  ) {
    this._parametersBag[entry] = this._parametersBag[entry] || {};
    this._parametersBag[entry][parametersGroupId] = parameters;

    return this;
  }

  /**
   * @returns {Promise<Buffer>}
   */
  compile() {
    let jsZip = new JSZip();
    let entriesToCompile = Object.keys(this._parametersBag);

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
    let entryParameterBag = this._parametersBag[entryName];

    return zip.file(entryName).async('string').then(entryContent => {
      for (let paramGroupId in entryParameterBag) {
        if (!entryParameterBag.hasOwnProperty(paramGroupId)) {
          continue;
        }

        let params = entryParameterBag[paramGroupId];

        entryContent = entryContent.replace(
          this._buildParametersReplaceRegExp(paramGroupId),
          this._buildParametersTemplate(params, paramGroupId)
        );
      }

      zip.file(entryName, entryContent);
    });
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

  /**
   * @param {String} groupId
   * @returns {RegExp}
   * @private
   */
  _buildParametersReplaceRegExp(groupId) {
    let cleanGroupId = groupId.replace(/[-[\]{}()*+?.,\\^$'|#\s]/g, '\\$&');

    return new RegExp(
      `'${cleanGroupId}\\-START'\\s*;?` +
      '(.|\\n)*' +
      `'${cleanGroupId}\\-END'\\s*;?`,
      'ig'
    );
  }

  /**
   * @param {Object} parameters
   * @param {String} groupId
   * @returns {String}
   */
  _buildParametersTemplate(parameters, groupId) {
    return `'${groupId}-START';` +
    `var ${Inflector.camelCase(groupId)}=${JSON.stringify(parameters)};` +
    `'${groupId}-END';`;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_PARAMETERS_GROUP_ID() {
    return 'DEEP-PARAMETERS';
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_ENTRY() {
    return 'bootstrap.js';
  }
}
