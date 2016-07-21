'use strict';

import {AbstractDriver} from './AbstractDriver';

export class VersionDriver extends AbstractDriver {
  /**
   * @param {String} version
   */
  constructor(version) {
    super();

    this._version = version;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let scriptContent = VersionDriver.SCRIPT_TPL.replace(/\{version\}/g, this.version);

    return this.replaceTags(
      htmlContent,
      VersionDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'version';
  }

  /**
   * @returns {String}
   */
  static get SCRIPT_TPL() {
    return '<meta name="version" content="{version}"/>';
  }
}
