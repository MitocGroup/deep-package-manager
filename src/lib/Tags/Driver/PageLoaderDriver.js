'use strict';

import path from 'path';
import FileSystem from 'graceful-fs';
import {AbstractDriver} from './AbstractDriver';
import {LoaderNotFoundException} from './Exception/LoaderNotFoundException';
import {InvalidMsIdentifierException} from './Exception/InvalidMsIdentifierException';
import {InvalidDeepIdentifierException} from './Exception/InvalidDeepIdentifierException';

/**
 * Custom Content Driver
 */
export class PageLoaderDriver extends AbstractDriver {
  /**
   * @param {Object} loader
   * @param {Object} microservices
   */
  constructor(loader, microservices) {
    super();

    this._loader = loader;
    this._microservices = microservices;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    return this.replaceTags(
      htmlContent,
      PageLoaderDriver.TAG_SUFFIX,
      this._getImgTag()
    );
  }

  /**
   *
   * @returns {String}
   */
  _getImgTag() {
    for (let msIdentifier in this._microservices) {
      if (!this._microservices.hasOwnProperty(msIdentifier)) {
        continue;
      }

      if (msIdentifier === this.microserviceIdentifier) {
        let msConfig = this._microservices[msIdentifier];
        let filePath = path.join(
          msConfig.autoload.frontend,
          this.resourcePath
        );

        if (!FileSystem.existsSync(filePath)) {
          throw new LoaderNotFoundException(filePath);
        }

        let src = '';
        if (msConfig.isRoot) {
          src = this.resourcePath;
        } else {
          src = path.join(
            msConfig.identifier,
            this.resourcePath
          );
        }

        return this._buildImgTag(src, this._loader.alt);
      }
    }

    throw new InvalidMsIdentifierException(this.microserviceIdentifier);
  }

  /**
   *
   * @param {String} src
   * @param {String} alt
   * @returns {String}
   */
  _buildImgTag(src, alt) {
    return `<img src="${src}" alt="${alt}">`
  }

  /**
   *
   * @returns {String}
   */
  get microserviceIdentifier() {
    return this.separateIdentifier(this._loader.src)[1];
  }

  /**
   *
   * @returns {String}
   */
  get resourcePath() {
    return this.separateIdentifier(this._loader.src)[2];
  }

  /**
   *
   * @param {String} identifier
   * @returns {Array}
   */
  separateIdentifier(identifier) {
    let regExp = /^@\s*([^:]+)\s*:\s*([^\s]+)\s*$/;

    if (typeof identifier === 'string' && regExp.test(identifier)) {
      return identifier.match(regExp);
    } else {
      throw new InvalidDeepIdentifierException(identifier);
    }
  }

  /**
   * @returns {string}
   */
  static get TAG_SUFFIX() {
    return 'loader';
  }
}
