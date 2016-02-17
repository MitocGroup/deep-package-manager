/**
 * Created by AlexanderC on 2/16/16.
 */

'use strict';

import Core from 'deep-core';
import {S3Driver as S3RegistryStorage} from '../../S3Driver';
import {ApiDriver as ApiRegistryStorage} from '../../ApiDriver';
import AWS from 'aws-sdk';

export class LambdaProxyHandler extends Core.AWS.Lambda.Runtime {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @todo: override it in lambda handler
   *
   * @returns {String}
   */
  get _storageMethod() {
    return 'NONE';
  }

  /**
   * @param {Object} proxyData
   */
  handle(proxyData) {
    new Core.Runtime.Sandbox(() => {
      let storage = this._registryStorage;

      let args = [proxyData.objPath,];

      if (proxyData.hasOwnProperty('data')) {
        args.push(ApiRegistryStorage._decodeResponseData(this._storageMethod, proxyData.data));
      }

      args.push((error, data) => {
        this.createResponse({
          error,
          data: ApiRegistryStorage._encodeResponseData(this._storageMethod, data),
        }).send();
      });

      storage[this._storageMethod](...args);
    })
      .fail((error) => {
        this.createResponse({
          error,
          data: null,
        }).send();
      })
      .run();
  }

  /**
   * @returns {Function}
   */
  get validationSchema() {
    return (Joi) => {
      return Joi.object().keys({
        objPath: Joi.string().required(),
        data: Joi.string().optional(),
      });
    };
  }

  /**
   * @returns {S3RegistryStorage|S3Driver|*}
   * @private
   */
  get _registryStorage() {
    let config = this._registryConfig;
    let bucket = config.bucket || this.kernel.config.buckets.system.name;
    let prefix = config.prefix || '';

    return new S3RegistryStorage(this._registryS3, bucket, prefix);
  }

  /**
   * @returns {AWS.S3|*}
   */
  get _registryS3() {
    return new AWS.S3(this._registryConfig.aws);
  }

  /**
   * @returns {Object|*}
   * @private
   */
  get _registryConfig() {
    return this.kernel.microservice().parameters.registry || {};
  }
}
