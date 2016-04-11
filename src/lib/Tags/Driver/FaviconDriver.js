'use strict';

import {AbstractDriver} from './AbstractDriver';
import {PathIdentifier} from './Helpers/PathIdentifier.js';

/**
 * Custom Content Driver
 */
export class FaviconDriver extends AbstractDriver {
  /**
   * @param {String} faviconIdentifier
   * @param {Object} microservices
   */
  constructor(faviconIdentifier, microservices) {
    super();

    this._faviconIdentifier = faviconIdentifier;
    this._microservices = microservices;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let path = new PathIdentifier(this._microservices, this._faviconIdentifier).getPath();
    return this.replaceTags(
      htmlContent,
      FaviconDriver.TAG_SUFFIX,
      this._buildFaviconTag(path)
    );
  }

  /**
   *
   * @param {String} path
   * @returns {String}
   */
  _buildFaviconTag(path) {
    return `<link rel="icon" href="${path}" type="image/x-icon"/>`;
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'favicon';
  }
}
