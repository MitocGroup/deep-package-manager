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

    this._principalId = null;
  }

  /**
   * @todo override it in lambda handler
   * @example putObj,readObj,hasObj,deleteObj
   */
  get _storageMethod() {
    throw new Error(`You should override _storageMethod getter in your implementation
    (allowed values: putObj, readObj, hasObj, deleteObj)`);
  }

  /**
   * @todo override it in lambda handler
   *
   * @private
   */
  get _principalRuleDbModelName() {
    return 'RegistryPrincipalRule';
  }

  /**
   * @todo override it in lambda handler
   *
   * @private
   */
  get _principalDbFieldName() {
    return 'PrincipalId';
  }

  /**
   * @todo override it in lambda handler
   *
   * @private
   */
  get _moduleDbFieldName() {
    return 'AllowedModules';
  }

  /**
   * @returns {Object}
   * @private
   */
  get _dbModel() {
    return this.kernel.get('db').get(this._principalRuleDbModelName);
  }

  /**
   * @returns {Cache|*}
   * @private
   */
  get _cache() {
    return this.kernel.get('cache');
  }

  /**
   * @returns {String}
   * @private
   */
  get _rulesCacheKey() {
    return `deep-registry-${this._principalRuleDbModelName}-${this._principalDbFieldName}-${this._principalId}`;
  }

  /**
   * @param {String} moduleName
   * @param {Function} cb
   * @private
   */
  _isModuleOperationAllowed(moduleName, cb) {

    // assuming no custom auth lambda triggered
    if (this._principalId === 'ANON') {
      cb(null, true);
      return;
    }

    let cacheKey = this._rulesCacheKey;

    this._cache.has(cacheKey, (error, entryExists) => {
      if (error) {
        cb(error, null);
        return;
      }

      if (entryExists) {
        this._cache.get(cacheKey, (error, rawData) => {
          try {
            cb(null, this._matchModuleOperation(moduleName, JSON.parse(rawData)));
          } catch (exception) {

            // invalidate it async
            this._cache.invalidate(cacheKey);

            cb(exception, null);
          }
        });
      } else {
        this._dbModel.findAllBy(this._principalDbFieldName, this._principalId, (error, data) => {
          if (error) {
            cb(error, null);
            return;
          }

          let principalEntries = (data.Items || []);

          try {
            // persist it async
            this._cache.set(cacheKey, JSON.stringify(principalEntries), LambdaProxyHandler.CACHE_TTL);
          } catch (exception) {
            console.log('Unable to set cache: ', error);
          }

          cb(null, this._matchModuleOperation(moduleName, principalEntries));
        });
      }
    });
  }

  /**
   * @param {String} moduleName
   * @param {Object[]} principalEntries
   * @returns {Boolean}
   * @private
   */
  _matchModuleOperation(moduleName, principalEntries) {
    for (let i in principalEntries) {
      if (!principalEntries.hasOwnProperty(i)) {
        continue;
      }

      let principalEntry = principalEntries[i];
      let allowedModules = principalEntry.hasOwnProperty(this._moduleDbFieldName) ?
        (principalEntry[principalEntry] || []) :
        [];

      for (let j in allowedModules) {
        if (!allowedModules.hasOwnProperty(j)) {
          continue;
        }

        let rule = LambdaProxyHandler._parseModuleRule(allowedModules[j]);

        if (LambdaProxyHandler._isOpModAllowed(moduleName, this._storageMethod, rule)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * @param {String} mod
   * @param {String} op
   * @param {{module: *, operation: *}} rule
   * @returns {Boolean}
   * @private
   */
  static _isOpModAllowed(mod, op, rule) {
    let modMatched = rule.module === '*' || rule.module === mod;
    let opMatched = rule.operation === '*' || rule.operation === LambdaProxyHandler.OP_RW ||
      ['hasObj', 'readObj'].indexOf(op) !== -1 && rule.operation === LambdaProxyHandler.OP_R ||
      ['putObj', 'deleteObj'].indexOf(op) !== -1 && rule.operation === LambdaProxyHandler.OP_W;

    return modMatched && opMatched;
  }

  /**
   * @param {String} rule
   * @returns {{module: *, operation: *}}
   * @private
   */
  static _parseModuleRule(rule) {
    let parts = rule.split(':');

    let module = parts[0];
    let rawOperation = parts.length > 1 ? parts[1] : '*';
    let operation = null;

    if (rawOperation === '*') {
      operation = LambdaProxyHandler.OP_RW;
    } else {
      if (rawOperation.indexOf('r') !== -1) {
        operation = LambdaProxyHandler.OP_R;
      }

      if (rawOperation.indexOf('w') !== -1) {
        operation = operation ? LambdaProxyHandler.OP_RW : LambdaProxyHandler.OP_W;
      }
    }

    return {module, operation,};
  }

  /**
   * @param {Object} requestData
   */
  handle(requestData) {
    this._principalId = requestData.principalId;

    let proxyData = requestData.payload;

    new Core.Runtime.Sandbox(() => {
      let moduleName = LambdaProxyHandler._extractModuleNameFromObjPath(proxyData.objPath);

      this._isModuleOperationAllowed(moduleName, (error, isAllowed) => {
        if (error || !isAllowed) {
          this.createResponse({
            error: error || new Error(
              `Access denied on module '${moduleName}' for '${this._principalId}'/${this._storageMethod}`
            ),
            data: null,
          }).send();

          return;
        }

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
      });
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
   * @param {String} objPath
   * @returns {String|null}
   * @private
   */
  static _extractModuleNameFromObjPath(objPath) {
    let matches = objPath.match(/^\/?([^\/]+)(?:\/.*)?$/gi);

    if (matches && matches.length === 2) {
      return matches[1].toString();
    }

    return null;
  }

  /**
   * @returns {String|null|*}
   */
  get principalId() {
    return this._principalId;
  }

  /**
   * @returns {Function}
   */
  get validationSchema() {
    return (Joi) => {
      return Joi.object().keys({
        principalId: Joi.string().required(),
        payload: Joi.object().keys({
          objPath: Joi.string().required(),
          data: Joi.string().optional(),
        }),
      });
    };
  }

  /**
   * @returns {S3RegistryStorage|S3Driver|*}
   * @private
   */
  get _registryStorage() {
    let config = this._registryConfig;
    let bucket = config.bucket || this.kernel.config.buckets.private.name;
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

  /**
   * @returns {String}
   */
  static get OP_R() {
    return 'read';
  }

  /**
   * @returns {String}
   */
  static get OP_W() {
    return 'write';
  }

  /**
   * @returns {String}
   */
  static get OP_RW() {
    return 'read/write';
  }

  /**
   * @returns {Number}
   */
  static get CACHE_TTL() {
    return 60;
  }
}
