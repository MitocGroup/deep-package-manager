'use strict';

import {AbstractDriver} from './AbstractDriver';
import {PathIdentifier} from './Helpers/PathIdentifier.js';

/**
 * Custom Content Driver
 */
export class PageLoaderDriver extends AbstractDriver {
  /**
   * @param {Object} loaderConfig
   * @param {Object} microservices
   */
  constructor(loaderConfig, microservices) {
    super();

    this._loader = loaderConfig;
    this._microservices = microservices;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let path = new PathIdentifier(this._microservices, this._loader.src).getPath();
    return this.replaceTags(
      htmlContent,
      PageLoaderDriver.TAG_SUFFIX,
      this._buildImgTag(path, this._loader.alt)
    );
  }

  /**
   *
   * @param {String} src
   * @param {String} alt
   * @returns {String}
   */
  _buildImgTag(src, alt) {
    return `<img src="${src}" alt="${alt}">`;
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'loader';
  }
}
