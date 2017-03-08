/**
 * Created by AlexanderC on 11/17/15.
 */

'use strict';

import {AbstractReplacer} from './AbstractReplacer';
import findHtmlAssets from 'find-assets';
import findCssAssets from 'css-find-assets';
import parseCss from 'css-parse';

export class UrlReplacer extends AbstractReplacer {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {String} content
   * @param {String} extension
   * @returns {String}
   */
  _replace(content, extension) {
    let uriMap = {};

    switch (extension) {
      case 'html':
        uriMap = UrlReplacer._parseHtml(content);
        break;
      case 'css':
        uriMap = UrlReplacer._parseCss(content);
        break;
      default: throw new Error(`Unsupported UrlReplacer content *.${extension}`);
    }

    let versionedMap = this._versionedReplacementsMap(uriMap);

    for (let search in versionedMap) {
      if (!versionedMap.hasOwnProperty(search)) {
        continue;
      }

      let replacement = versionedMap[search];

      content = UrlReplacer._replaceAll(
        content,
        search,
        replacement
      );
    }

    return content;
  }

  /**
   * @param {Object} uriMap
   * @returns {Object}
   * @private
   */
  _versionedReplacementsMap(uriMap) {
    let replacements = {};

    for (let node in uriMap) {
      if (!uriMap.hasOwnProperty(node)) {
        continue;
      }

      let uri = uriMap[node];
      let delimiter = UrlReplacer._getUriDelimiter(uri);

      replacements[node] = UrlReplacer._replaceAll(
        node,
        uri,
        `$1${delimiter}${UrlReplacer.VERSION_PARAM}=${this._version}`
      );
    }

    return replacements;
  }

  /**
   * @param {String} uri
   * @returns {String}
   * @private
   */
  static _getUriDelimiter(uri) {
    return uri.indexOf('?') === -1 ? '?' : '&';
  }

  /**
   * @param {String} str
   * @param {String} search
   * @param {String} replace
   * @returns {String}
   * @private
   */
  static _replaceAll(str, search, replace) {
    return str.replace(
      new RegExp(`(${UrlReplacer._escapeRegExp(search)})`, 'g'),
      replace
    );
  }

  /**
   * @param {String} str
   * @returns {String}
   * @private
   */
  static _escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, '\\$1');
  }

  /**
   * @param {String} content
   * @returns {Object}
   * @private
   */
  static _parseHtml(content) {
    let result = {};
    let rawAst = findHtmlAssets.html(content);

    for (let i in rawAst) {
      if (!rawAst.hasOwnProperty(i)) {
        continue;
      }

      let typeVector = rawAst[i];

      for (let j in typeVector) {
        if (!typeVector.hasOwnProperty(j)) {
          continue;
        }

        let matchObj = typeVector[j];

        result[matchObj.string] = matchObj.url;
      }
    }

    return result;
  }

  /**
   * @param {String} content
   * @returns {Object}
   * @private
   */
  static _parseCss(content) {
    let result = {};
    let rawAst = findCssAssets(parseCss(content));

    for (let i in rawAst) {
      if (!rawAst.hasOwnProperty(i)) {
        continue;
      }

      let matchObj = rawAst[i];

      result[matchObj.node.value] = matchObj.url;
    }

    return result;
  }
  
  /**
   * @returns {String}
   */
  static get VERSION_PARAM() {
    return '_v';
  }
}
