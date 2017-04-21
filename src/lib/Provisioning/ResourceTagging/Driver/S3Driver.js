/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import Core from 'deep-core';

export class S3Driver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.s3.config.region;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
  }

  /**
   * @returns {Array}
   */
  resourcesArns() {
    return this.buckets.map(bucket => `arn:aws:s3:::${bucket}`);
  }

  /**
   * @returns {String[]}
   */
  get buckets() {
    let buckets = [];
    let provision = this.provisioning.config.s3.buckets;

    for (let name in provision) {
      if (!provision.hasOwnProperty(name)) {
        continue;
      }

      buckets.push(provision[name].name);
    }

    return buckets;
  }
}
