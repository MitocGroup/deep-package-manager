/**
 * Created by CCristi on 6/29/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import Path from 'path';
import {Config} from '../Config';
import {Instance as Microservice} from '../../Microservice/Instance';
import {MissingRootException} from '../Exception/MissingRootException';
import fs from 'fs';
import fse from 'fs-extra';

export class OptimisticStrategy extends AbstractStrategy {
  /**
   * @param path
   */
  constructor(path) {
    super();

    this._path = path;
  }

  /**
   * @returns {String}
   */
  path() {
    return this._path;
  }

  /**
   * @returns {Object}
   */
  config() {
    let configFile = Path.join(this._path, Config.DEFAULT_FILENAME);

    if (!fs.existsSync(configFile)) {
      if (this._hasMicroservices()) {
        fse.outputJsonSync(configFile, Config.generate());
      } else {
        throw new MissingRootException();
      }
    }

    return fse.readJsonSync(configFile);
  }

  /**
   * @param {String|null} path
   * @returns {Boolean}
   * @private
   */
  _hasMicroservices(path = null) {
    path = path || this._path;

    let resources = fs.readdirSync(path);

    for (let resource of resources) {
      let fullPath = Path.join(path, resource);

      if (fs.statSync(fullPath).isDirectory() &&
        fs.existsSync(Path.join(fullPath, Microservice.CONFIG_FILE))) {

        return true;
      }
    }

    return false;
  }

  /**
   * @returns {Boolean}
   */
  shouldPreserve(/* microservice */) {
    return true;
  }
}
