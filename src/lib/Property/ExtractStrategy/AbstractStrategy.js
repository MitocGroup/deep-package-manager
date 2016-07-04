/**
 * Created by CCristi on 6/29/16.
 */

'use strict';

import Core from 'deep-core';
import fs from 'fs';
import Path from 'path';
import {Instance as Microservice} from '../../Microservice/Instance';

export class AbstractStrategy extends Core.OOP.Interface {
  constructor() {
    super(['path', 'config', 'shouldPreserve']);
  }

  /**
   * @param {String} path
   * @returns {AbstractStrategy}
   */
  static create(path) {
    if (fs.existsSync(Path.join(path, Microservice.CONFIG_FILE))) {
      let PessimisticStrategy = require('./PessimisticStrategy').PessimisticStrategy;

      return PessimisticStrategy.create(path);
    }

    let OptimisticStrategy = require('./OptimisticStrategy').OptimisticStrategy;

    return new OptimisticStrategy(path);
  }
}
