/**
 * Created by CCristi on 7/11/16.
 */

'use strict';

import Core from 'deep-core';
import {ComplexDriver} from '../../ComplexDriver';

export class AbstractHandler extends Core.OOP.Interface {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    super('mapError');

    this._driver = driver;
  }

  /**
   * @returns {AbstractHandler}
   */
  extend() {
    AbstractHandler.METHODS.forEach(method => {
      let originalMethod = this._driver[method];

      this._driver[method] = (...args) => {
        let originalCallback = args.pop();

        originalMethod.call(this._driver, ...args, (error, response) => {
          if (!error) {
            originalCallback(null, response);
            return;
          }

          originalCallback(this.mapError(error), response);
        });
      }
    });

    return this;
  }

  /**
   * @returns {AbstractDriver}
   */
  get driver() {
    return this._driver;
  }

  /**
   * @returns {String[]}
   */
  static get METHODS() {
    return ComplexDriver.READ_METHODS;
  }
}
