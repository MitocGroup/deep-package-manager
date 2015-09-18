/**
 * Created by AlexanderC on 7/28/15.
 */

'use strict';

import Core from '@mitocgroup/deep-core';
import Path from 'path';
import {Instance as Microservice} from '../Microservice/Instance';
import FileSystem from 'fs';
import {WaitFor} from '../Helpers/WaitFor';

/**
 * Dependencies dispatcher
 */
export class Dispatcher extends Core.OOP.Interface {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    super(['dispatch']);

    this._driver = driver;
    this._microservices = null;
  }

  /**
   * @param {Function} callback
   */
  dispatchBatch(callback) {
    this._resolveStack = [];

    let wait = new WaitFor();
    let microservices = this.microservices;
    let remaining = microservices.length;

    for (let microservice of microservices) {
      this.dispatch(microservice, function() {
        remaining--;
      }.bind(this));
    }

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    wait.ready(function() {
      this._resolveStack = [];

      callback();
    }.bind(this));
  }

  /**
   * @returns {AbstractDriver}
   */
  get driver() {
    return this._driver;
  }

  /**
   * @returns {Microservice[]}
   */
  get microservices() {
    if (this._microservices === null) {
      this._microservices = [];

      let files = FileSystem.readdirSync(this._driver.basePath);

      for (let file of files) {
        let fullPath = Path.join(this._driver.basePath, file);

        if (FileSystem.statSync(fullPath).isDirectory()
          && FileSystem.existsSync(Path.join(fullPath, Microservice.CONFIG_FILE))) {
          this._microservices.push(Microservice.create(fullPath));
        }
      }
    }

    return this._microservices;
  }
}
