/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import FileSystem from 'fs';
import {Exception} from '../Exception/Exception';

/**
 * S3 standard driver implementation
 */
export class S3StdDriver extends AbstractDriver {
  /**
   * @param {Object} AWS
   * @param {String} bucket
   */
  constructor(AWS, bucket) {
    super();

    this._s3 = new AWS.S3();
    this._bucket = bucket;
  }

  /**
   * @returns {String}
   */
  get bucket() {
    return this._bucket;
  }

  /**
   * @param {String} mainPath
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Function} callback
   */
  push(mainPath, dependencyName, dependencyVersion, callback) {
    let archivePath = this._getArchivePath(dependencyName, dependencyVersion);

    this._pack(mainPath, archivePath, (archivePath) => {
      let parameters = {
        Bucket: this._bucket,
        Key: this._getPrefixedBasename(dependencyName, dependencyVersion),
        Body: FileSystem.createReadStream(archivePath),
      };

      if (this._dryRun) {
        FileSystem.unlink(archivePath, callback);
        return;
      }

      this._s3
        .putObject(parameters)
        .on('complete', (response) => {
          if (response.error) {
            throw new Exception(
              `Error while persisting s3://${parameters.Bucket}/${parameters.Key}: ${response.error}`
            );
          }

          FileSystem.unlink(archivePath, callback);
        })
        .send();
    });
  }

  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Function} callback
   */
  pull(dependencyName, dependencyVersion, callback) {
    let archivePath = this._getArchivePath(dependencyName, dependencyVersion);

    let outputStream = FileSystem.createWriteStream(archivePath);

    let parameters = {
      Bucket: this._bucket,
      Key: this._getPrefixedBasename(dependencyName, dependencyVersion),
    };

    if (this._dryRun) {
      callback();
      return;
    }

    this._s3
      .getObject(parameters)
      .on('httpData', (chunk) => {
        outputStream.write(chunk);
      })
      .on('httpDone', () => {
        outputStream.end();
      })
      .on('complete', (response) => {
        if (response.error) {
          throw new Exception(
            `Error while retrieving s3://${parameters.Bucket}/${parameters.Key}: ${response.error}`
          );
        }

        this._unpack(this._getArchivePath(dependencyName, dependencyVersion), (outputPath) => {
          FileSystem.unlink(archivePath, () => {
            callback(outputPath);
          });
        });
      })
      .send();
  }
}