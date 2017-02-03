/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {S3Driver} from './Driver/S3Driver';
import {ESDriver} from './Driver/ESDriver';
import {CloudFrontDriver} from './Driver/CloudFrontDriver';
import {DynamoDBDriver} from './Driver/DynamoDBDriver';

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
   * @returns {Tagging}
   */
  static create(property, applicationName = null) {
    applicationName = applicationName || property.name;

    let s3Driver = new S3Driver(property, applicationName);
    let esDriver = new ESDriver(property, applicationName);
    let cloudFrontDriver = new CloudFrontDriver(property, applicationName);
    let dynamoDbDriver = new DynamoDBDriver(property, applicationName);

    return new Tagging(s3Driver, esDriver, cloudFrontDriver, dynamoDbDriver);
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
