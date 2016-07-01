/**
 * Created by CCristi on 6/29/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import Path from 'path';
import {Config} from '../Config';
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
      fse.outputJsonSync(configFile, Config.generate());
    }

    return fse.readJsonSync(configFile);
  }

  /**
   * @returns {Boolean}
   */
  shouldPreserve(/* microservice */) {
    return true;
  }
}
