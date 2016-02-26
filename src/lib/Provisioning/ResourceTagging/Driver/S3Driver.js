/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {AwsRequestSyncStack} from '../../../Helpers/AwsRequestSyncStack';

export class S3Driver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._s3 = this.provisioning.s3;
  }

  /**
   * @returns {AWS.S3|*}
   */
  get s3() {
    return this._s3;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let stack = new AwsRequestSyncStack();
    let tagsPayload = this.tagsPayload;

    this.buckets.forEach((bucket) => {
      let payload = {
        Bucket: bucket,
        Tagging: {
          TagSet: tagsPayload,
        },
      };

      stack.push(this._s3.putBucketTagging(payload), (error) => {
        if (error) {
          console.error(`Error on tagging S3 bucket ${bucket}: ${error}`);
        } else {
          console.log(`S3 bucket ${bucket} has been successfully tagged`);
        }
      });
    });

    stack.join().ready(cb);
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
