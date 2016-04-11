'use strict';

import {InvalidDeepIdentifierException} from '../Exception/InvalidDeepIdentifierException';
import {InvalidMsIdentifierException} from '../Exception/InvalidMsIdentifierException';
import {FileNotFoundException} from '../Exception/FileNotFoundException';
import FileSystem from 'graceful-fs';
import Path from 'path';

export class PathIdentifier {
  /**
   *
   * @param {Object} microservices
   * @param {String} identifier
   */
  constructor(microservices, identifier) {
    this._microservices = microservices;
    this._identifier = identifier;
  }

  /**
   *
   * @returns {String}
   */
  getPath() {
    for (let msIdentifier in this._microservices) {
      if (!this._microservices.hasOwnProperty(msIdentifier)) {
        continue;
      }

      if (msIdentifier === this.microserviceIdentifier) {
        let msConfig = this._microservices[msIdentifier];
        let filePath = Path.join(
          msConfig.autoload.frontend,
          this.resourcePath
        );

        if (!FileSystem.existsSync(filePath)) {
          throw new FileNotFoundException(filePath);
        }

        let path = '';
        if (msConfig.isRoot) {
          path = this.resourcePath;
        } else {
          path = Path.join(
            msConfig.identifier,
            this.resourcePath
          );
        }

        return path;
      }
    }

    throw new InvalidMsIdentifierException(this.microserviceIdentifier);
  }

  /**
   *
   * @param {String} identifier
   * @returns {Array}
   */
  static separateIdentifier(identifier) {
    let regExp = /^@\s*([^:]+)\s*:\s*([^\s]+)\s*$/;

    if (typeof identifier === 'string' && regExp.test(identifier)) {
      return identifier.match(regExp);
    }

    throw new InvalidDeepIdentifierException(identifier);
  }


  /**
   *
   * @returns {String}
   */
  get microserviceIdentifier() {
    return PathIdentifier.separateIdentifier(this._identifier)[1];
  }

  /**
   *
   * @returns {String}
   */
  get resourcePath() {
    return PathIdentifier.separateIdentifier(this._identifier)[2];
  }
}