/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {FSDriver} from './FSDriver';
import path from 'path';

export class S3Driver extends FSDriver {
  /**
   * @param {AWS.S3} s3
   * @param {String} bucket
   * @param {String} prefix
   */
  constructor(s3, bucket, prefix = '') {
    super(bucket);

    this._s3 = s3;
    this._prefix = prefix;
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
  get prefix() {
    return this._prefix;
  }

  /**
   * @returns {String}
   */
  get bucket() {
    return this._dir;
  }

  /**
   * @param {String} objPath
   * @returns {String}
   * @private
   */
  _fullObjPath(objPath) {
    objPath = path.join(this._prefix, objPath);

    return path.normalize(objPath).replace(/(?:\/|\\)/i, '/');
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  hasObj(objPath, cb) {
    let payload = {
      Bucket: this.bucket,
      Key: this._fullObjPath(objPath),
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
      Key: this._fullObjPath(objPath),
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
      Key: this._fullObjPath(objPath),
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
      Key: this._fullObjPath(objPath),
    };

    this._s3.deleteObject(payload, (error) => {
      cb(error);
    });
  }
}
