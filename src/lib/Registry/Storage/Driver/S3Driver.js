/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {FSDriver} from './FSDriver';

export class S3Driver extends FSDriver {
  /**
   * @param {AWS.S3} s3
   * @param {String} bucket
   */
  constructor(s3, bucket) {
    super(bucket);

    this._s3 = s3;
  }

  /**
   * @returns {AWS.S3}
   */
  get s3() {
    return this._s3;
  }

  /**
   * @returns {String}
   */
  get bucket() {
    return this._dir;
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  hasObj(objPath, cb) {
    let payload = {
      Bucket: this.bucket,
      Key: objPath,
    };

    this._s3.headObject(payload, (error) => {
      if (error && error.code !== 'NoSuchKey') {
        cb(error, null);
        return;
      }

      cb(null, error ? false : true);
    });
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  readObj(objPath, cb) {
    let payload = {
      Bucket: this.bucket,
      Key: objPath,
    };

    this._s3.getObject(payload, (error, data) => {
      if (error) {
        cb(error, null);
        return;
      }

      cb(null, data.Body.toString());
    });
  }

  /**
   * @param {String} objPath
   * @param {String|*} data
   * @param {Function} cb
   */
  putObj(objPath, data, cb) {
    let payload = {
      Bucket: this.bucket,
      Key: objPath,
      Body: data.toString(),
    };

    this._s3.putObject(payload, (error) => {
      cb(error);
    });
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  deleteObj(objPath, cb) {
    let payload = {
      Bucket: this.bucket,
      Key: objPath,
    };

    this._s3.deleteObject(payload, (error) => {
      cb(error);
    });
  }
}
