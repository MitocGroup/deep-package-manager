'use strict';

import path from 'path';
import FileSystem from 'graceful-fs';
import {AbstractDriver} from './AbstractDriver';
import {FileNotFound} from './Exception/FileNotFound';
import {InvalidMsIdentifier} from './Exception/InvalidMsIdentifier';
import {InvalidDeepIdentifierException} from './Exception/InvalidDeepIdentifierException';

/**
 * Custom Content Driver
 */
export class PageLoaderDriver extends AbstractDriver {
  /**
   * @param {String} loaderIdentifier
   * @param {Object} microservices
   */
  constructor(loaderIdentifier, microservices) {
    super();

    this._loaderIdentifier = loaderIdentifier;
    this._microservices = microservices;
  }

  /**
   * @param {String} htmlContent
   * @returns {*}
   */
  inject(htmlContent) {
    let scriptContent = this.getFileContent();

    return this.replaceTags(
      htmlContent,
      PageLoaderDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   *
   * @returns {*}
   */
  getFileContent() {
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

        if (FileSystem.existsSync(filePath)) {
          return FileSystem.readFileSync(filePath);
        } else {
          throw new FileNotFound(filePath);
        }
      }
    }

    throw new InvalidMsIdentifier(this.microserviceIdentifier);
  }

  /**
   *
   * @returns {String}
   */
  get microserviceIdentifier() {
    return this.separateIdentifier(this._loaderIdentifier)[1];
  }

  /**
   *
   * @returns {String}
   */
  get resourcePath() {
    return this.separateIdentifier(this._loaderIdentifier)[2];
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
