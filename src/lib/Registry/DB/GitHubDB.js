/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {ModuleDB} from './ModuleDB';

export class GitHubDB extends ModuleDB {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._config = this._parseConfig();
  }

  /**
   * @returns {Object}
   * @private
   */
  _parseConfig() {
    return this._config.reduce((config, tag) => {
      let version = tag.name.replace('^v([\d\.]+)', '$1');

      config[version] = tag;
      
      return config;
    }, {});
  }
}
