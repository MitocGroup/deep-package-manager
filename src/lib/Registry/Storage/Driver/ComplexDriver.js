/**
 * Created by CCristi on 6/14/16.
 */

'use strict';

import {AbstractReadonlyDriver} from './AbstractReadonlyDriver';

export class ComplexDriver /* extends AbstractDriver */ {
  /**
   * @param {AbstractDriver[]} drivers
   */
  constructor(...drivers){ 
    this._drivers = drivers;

    this._extendReadMethods();
    this._extendWriteMethods();
  }

  /**
   * @param {AbstractDriver} driver
   * @returns {ComplexDriver}
   */
  addDriver(driver) {
    for (let _driver of this._drivers) {
      if (_driver.prototype === driver.prototype) {
        return this;
      }
    }

    this._drivers.push(driver);
    return this;
  }

  /**
   * @returns {ComplexDriver}
   */
  _extendWriteMethods() {
    ComplexDriver.WRITE_METHODS.forEach(method => {
      this[method] = (...args) => {
        let driversClone = [].concat(this._drivers).filter(ComplexDriver.WRITE_AWARE_DRIVER_FILTER);

        this._writeMethodQueueMap(
          driversClone,
          method,
          [],
          [],
          ...args
        )
      }
    });
    
    return this;
  }

  /**
   * @returns {ComplexDriver}
   * @private
   */
  _extendReadMethods() {
    ComplexDriver.READ_METHODS.forEach(method => {
      this[method] = (...args) => {
        let driversClone = [].concat(this._drivers);

        this._readMethodQueueMap(
          driversClone,
          method,
          ...args
        );
      }
    });

    return this;
  }

  /**
   * @param {AbstractDriver[]} drivers
   * @param {String} method
   * @param {Error[]} errors
   * @param {Object[]} results
   * @param {Object[]} args
   * @private
   */
  _writeMethodQueueMap(drivers, method, errors, results, ...args) {
    let driver = drivers.shift();
    let originalCb = args.pop();

    driver[method](...args, (error, result) => {
      if (error) {
        errors.push(error);

        if (drivers.length === 0) {
          originalCb(errors, null);
        } else {
          this._writeMethodQueueMap(drivers, method, errors, results, ...args.concat(originalCb));
        }

        return;
      }

      results.push(result);

      if (drivers.length !== 0) {
        this._writeMethodQueueMap(drivers, method, errors, results, ...args.concat(originalCb));
        return;
      }

      originalCb(
        errors.length === 0 ? null : errors, 
        results.length === 1 ? results[0] : results
      );
    });
  }

  /**
   * @param {AbstractDriver[]} drivers
   * @param {String} method
   * @param {Object[]} args
   * @private
   */
  _readMethodQueueMap(drivers, method, ...args) {
    let driver = drivers.shift();
    let originalCb = args.pop();

    driver[method](...args, (error, result) => {
      if (error) {
        if (drivers.length === 0) {
          originalCb(error, null);
        } else {
          this._readMethodQueueMap(drivers, method, ...args.concat(originalCb));
        }

        return;
      }

      if (!result && drivers.length !== 0) {
        this._readMethodQueueMap(drivers, method, ...args.concat(originalCb));
        return;
      }

      originalCb(null, result);
    });
  }

  /**
   * @param {Function} Proto
   * @returns {AbstractDriver}
   */
  find(Proto) {
    for (let driver of this._drivers) {
      if (driver.constructor === Proto) {
        return driver;
      }
    }

    return null;
  }

  /**
   * @returns {String[]}
   */
  static get READ_METHODS() {
    return [
      'hasObj',
      'readObj',
    ];
  }

  /**
   * @returns {String[]}
   */
  static get WRITE_METHODS() {
    return [
      'putObj', 'deleteObj', 'lockObj',
      'releaseObjLock', 'isObjLocked',
    ];
  }

  /**
   * @param {AbstractDriver|AbstractReadonlyDriver} driver
   * @returns {boolean}
   */
  static WRITE_AWARE_DRIVER_FILTER(driver) {
    return !(driver instanceof AbstractReadonlyDriver);
  }
}
