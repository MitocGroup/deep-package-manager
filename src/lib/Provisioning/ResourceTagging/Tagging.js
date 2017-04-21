/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import {WaitFor} from '../../Helpers/WaitFor';
import {S3Driver} from './Driver/S3Driver';
import {ESDriver} from './Driver/ESDriver';
import {CloudFrontDriver} from './Driver/CloudFrontDriver';
import {DynamoDBDriver} from './Driver/DynamoDBDriver';
import {LambdaDriver} from './Driver/LambdaDriver';

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
    let lambdaDriver = new LambdaDriver(property, applicationName);

    return new Tagging(s3Driver, esDriver, cloudFrontDriver, dynamoDbDriver, lambdaDriver);
  }

  /**
   * @returns {AbstractDriver[]|S3Driver[]|*}
   */
  get drivers() {
    return this._drivers;
  }

  /**
   * @param {Function} cb
   * @param {Number} step
   * @returns {Tagging}
   */
  tag(cb, step = Tagging.PROVISION_STEP) {
    let wait = new WaitFor();
    let drivers = this._drivers.filter(driver => driver.step() === step);
    let remaining = drivers.length;

    wait.push(() => {
      return remaining <= 0;
    });

    drivers.forEach((driver) => {
      driver.tag(() => {
        remaining--;
      });
    });

    wait.ready(cb);

    return this;
  }

  /**
   * @returns {number}
   * @constructor
   */
  static get PROVISION_STEP() {
    return 0x001;
  }

  /**
   * @returns {Number}
   */
  static get POST_DEPLOY_STEP() {
    return 0x002;
  }
}
