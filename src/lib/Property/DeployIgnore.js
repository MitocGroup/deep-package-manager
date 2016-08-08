/**
 * Created by CCristi on 8/8/16.
 */

'use strict';

import {Exception} from '../Exception/Exception';
import fs from 'fs';
import path from 'path';
import os from 'os';

export class DeployIgnore {
  /**
   * @param {String[]} ignorePatterns
   */
  constructor(ignorePatterns) {
    this._filters = this._buildFilters(ignorePatterns);
  }

  /**
   * @param {String[]} ignorePatterns
   * @returns {Object}
   * @private
   */
  _buildFilters(ignorePatterns) {
    let filters = {
      resource: [],
    };

    for (let ignorePattern of ignorePatterns) {
      let filterParts = this._buildFilter(ignorePattern);
      let filterNamespace = filterParts[0];
      let filterFunc = filterParts[1];

      filters[filterNamespace].push(filterFunc);
    }

    return filters;
  }

  /**
   * @param {String} ignorePattern
   * @returns {[String, Function]}
   * @private
   */
  _buildFilter(ignorePattern) {
    let notFilter = false;

    if (ignorePattern.charAt(0) === '!') {
      notFilter = true;
      ignorePattern = ignorePattern.slice(1);
    }

    let matches = ignorePattern.match(/^([^\/]+)\/(.+)$/);

    if (!matches) {
      throw new Exception(`Invalid ignore pattern: "${ignorePattern}"`);
    }

    let namespace = matches[1];
    let regExpStr = matches[2];

    regExpStr = regExpStr.replace(/[-\/\\^$+?.()|[\]{}]/g, '\\$&'); // escape all characters except '*'
    regExpStr = regExpStr.replace(/\*/g, '[a-zA-Z\\d+\\-_\\.]+');

    let regExp = new RegExp(regExpStr);
    let filterFunc = (resource) => {
      if (regExp.test(resource)) {
        return notFilter ? DeployIgnore.F_KEEP : DeployIgnore.F_IGNORE;
      }

      return DeployIgnore.F_ABSTAIN;
    };

    return [namespace, filterFunc,];
  }

  /**
   * @param {String} namespace
   * @param {String} resources
   * @returns {Array}
   */
  filter(namespace, resources) {
    let validResources = [];

    for (let resource of resources) {
      this.keep(namespace, resources) && validResources.push(resource);
    }

    return validResources;
  }

  /**
   * @param {String} namespace
   * @param {String} resource
   * @returns {Boolean}
   */
  keep(namespace, resource) {
    let keep = true;
    let filterFunctions = this._filters[namespace] || [];

    for (let filterFunc of filterFunctions) {
      switch (filterFunc(resource)) {
        case DeployIgnore.F_IGNORE:
          keep = false;
          break;
        case DeployIgnore.F_KEEP:
          keep = true;
          break;
      }
    }

    return keep;
  }

  /**
   * @param {String} dir
   * @returns {DeployIgnore}
   */
  static create(dir) {
    let file = path.join(dir, DeployIgnore.DEFAULT_FILENAME);
    let ignorePatterns = [];

    if (fs.existsSync(file)) {
      let ignoreContent = fs.readFileSync(file).toString();
      ignorePatterns = ignoreContent.split(os.EOL).map(l => l.trim()).filter(l => l);
    }

    return new DeployIgnore(ignorePatterns);
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_FILENAME() {
    return '.deeployignore';
  }

  /**
   * @returns {String}
   */
  static get RESOURCE() {
    return 'resource';
  }

  /**
   * @returns {Number}
   */
  static get F_ABSTAIN() {
    return 0;
  }

  /**
   * @returns {Number}
   */
  static get F_KEEP() {
    return 1;
  }

  /**
   * @returns {Number}
   */
  static get F_IGNORE() {
    return -1;
  }
}
