'use strict';

import {AbstractDriver} from './AbstractDriver';

export class ApplicationIdDriver extends AbstractDriver {
  /**
   * @param {String} applicationId
   */
  constructor(applicationId) {
    super();

    this._applicationId = applicationId;
  }

  /**
   * @returns {String}
   */
  get applicationId() {
    return this._applicationId;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let scriptContent = ApplicationIdDriver.SCRIPT_TPL.replace(/\{applicationId\}/g, this.applicationId);

    return this.replaceTags(
      htmlContent,
      ApplicationIdDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'applicationId';
  }

  /**
   * @returns {String}
   */
  static get SCRIPT_TPL() {
    return `<meta name="application-id" content="{applicationId}"/>`;
  }
}
