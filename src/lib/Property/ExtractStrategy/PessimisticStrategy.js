/**
 * Created by CCristi on 6/30/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import path from 'path';
import {Config} from '../Config';
import fs from 'fs';
import fse from 'fs-extra';
import {Instance as Microservice} from '../../Microservice/Instance';
import crypto from 'crypto';

export class PessimisticStrategy extends AbstractStrategy {
  /**
   * @param {String} path
   * @param {String[]} positiveIdentifiers
   */
  constructor(path, ...positiveIdentifiers) {
    super();

    this._path = path;
    this._identifiers = positiveIdentifiers.sort();
  }

  /**
   * @returns {String}
   */
  path() {
    return this._path;
  }

  /**
   * @param {Microservice|Instance} microservice
   * @returns {Boolean}
   */
  shouldPreserve(microservice) {
    return this._identifiers.indexOf(microservice.identifier) !== -1;
  }

  /**
   * @returns {String|Object}
   */
  config() {
    let configFile = path.join(this.path(), Config.DEFAULT_FILENAME);

    if (!fs.existsSync(configFile)) {
      fse.outputJsonSync(configFile, Config.generate());
    }

    let configObj = fse.readJsonSync(configFile);

    configObj.appIdentifier += `.${this._collectionHash}.`;

    return configObj;
  }

  /**
   * @returns {String}
   * @private
   */
  get _collectionHash() {
    return PessimisticStrategy._hash(JSON.stringify(this._identifiers), 'md5');
  }

  /**
   * @param {String} str
   * @param {String} alg
   * @returns {String}
   * @private
   */
  static _hash(str, alg) {
    return crypto.createHash(alg).update(str).digest('hex');
  }

  /**
   * @param {String} msPath
   * @returns {PessimisticStrategy}
   */
  static create(msPath) {
    let microservice = Microservice.create(msPath);
    let identifiers = [microservice.identifier]
      .concat(Object.keys(microservice.config.dependencies))
      .concat(
        // @todo: find smarter way to  inject property root
        microservice.config.frontendEngine.map(e => `deep-root-${e}`)
      );

    identifiers = identifiers.reduce((uniqueArr, i) => {
      if (uniqueArr.indexOf(i) === -1) {
        uniqueArr.push(i);
      }

      return uniqueArr;
    }, []);

    return new PessimisticStrategy(path.join(msPath, '..'), ...identifiers);
  }
}
