/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import tmp from 'tmp';
import OS from 'OS';
import FS from 'fs';
import {exec} from 'child_process';

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
  service() {
    return 'S3';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeWebsite(resourceId, (error) => {
      if (error) {
        this._log(`No public website bound to ${resourceId}`);
      }

      //this._remove(resourceId, cb);
      this._removeUsingAwsCli(resourceId, cb);
    });
  }

  /**
   * @param {String} bucketName
   * @param {Function} cb
   * @private
   */
  _removeWebsite(bucketName, cb) {
    this._awsService.deleteBucketWebsite({
      Bucket: bucketName,
    }, (error) => {
      cb(error);
    });
  }

  /**
   * @todo: remove this hook when fixing s3 sync functionality
   *
   * @param {String} bucketName
   * @param {Function} cb
   * @private
   */
  _removeUsingAwsCli(bucketName, cb) {
    tmp.tmpName((error, credentialsFile) => {
      if (error) {
        cb(error);
        return;
      }

      let credentials = `[profile _deep_]${OS.EOL}`;
      credentials += `aws_access_key_id=${config.aws.accessKeyId}${OS.EOL}`;
      credentials += `aws_secret_access_key=${config.aws.secretAccessKey}${OS.EOL}`;
      credentials += `region=${config.aws.region}${OS.EOL}`;

      FS.writeFile(credentialsFile, credentials, (error) => {
        if (error) {
          cb(error);
          return;
        }

        let removeCommand = `export AWS_CONFIG_FILE=${credentialsFile};`;
        removeCommand += `aws --profile _deep_ s3 rb --force 's3://${bucketName}'`;

        exec(removeCommand, (error) => {
          FS.unlink(credentialsFile);

          if (error) {
            cb(error);
            return;
          }

          cb(null);
        });
      });
    });
  }

  /**
   * does not work because of buckets' objects...
   *
   * @param {String} bucketName
   * @param {Function} cb
   * @private
   */
  _remove(bucketName, cb) {
    this._awsService.deleteBucket({
      Bucket: bucketName,
    }, function(error) {
      cb(error);
    });
  }
}
