/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {S3Driver} from './Driver/S3Driver';

export class Tagging {
  /**
   * @param {AbstractDriver|S3Driver|*} drivers
   */
  constructor(...drivers) {
    this._drivers = drivers;
  }

  /**
   * @param {Property|Instance|*} property
   * @param {String|null} applicationName
   */
  static create(property, applicationName = null) {
    applicationName = applicationName || property.name;

    return new Tagging(new S3Driver(property, applicationName));
  }

  /**
   * @returns {AbstractDriver[]|S3Driver[]|*}
   */
  get drivers() {
    return this._drivers;
  }

  /**
   * @param {Function} cb
   * @returns {Tagging}
   */
  tag(cb) {
    let wait = new WaitFor();
    let remaining = this._drivers.length;

    wait.push(() => {
      return remaining <= 0;
    });

    this._drivers.forEach((driver) => {
      driver.tag(() => {
        remaining--;
      });
    });

    wait.ready(cb);

    return this;
  }
}
