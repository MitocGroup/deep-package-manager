/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import path from 'path';
import request from 'fetchy-request';
import {Hash} from '../../../Helpers/Hash';
import util from '../../../Helpers/util';
import {RegistryAutoDiscovery} from './Helpers/Api/RegistryAutoDiscovery';

export class ApiDriver extends AbstractDriver {
  /**
   * @param {RegistryConfig|*} registryConfig
   */
  constructor(registryConfig) {
    super();

    this._registryConfig = registryConfig;
    this._endpoints = registryConfig.extract();
  }

  /**
   * @param {String} baseHost
   * @param {Function} cb
   */
  static autoDiscover(baseHost, cb) {
    new RegistryAutoDiscovery(baseHost)
      .discover((error, registryConfig) => {
        if (error) {
          cb(error, null);
          return;
        }

        try {
          cb(null, new ApiDriver(registryConfig));
        } catch (error) {
          cb(error, null);
        }
      });
  }

  /**
   * @returns {Object}
   */
  get endpoints() {
    return this._endpoints;
  }

  /**
   * @returns {RegistryConfig|*}
   */
  get registryConfig() {
    return this._registryConfig;
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  hasObj(objPath, cb) {
    this._request('hasObj', objPath, (error, data) => {
      let resultError = error || data.error;

      cb(resultError, resultError ? null : data.data);
    });
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  readObj(objPath, cb) {
    this._request('readObj', objPath, (error, data) => {
      let resultError = error || data.error;

      cb(resultError, resultError ? null : data.data);
    });
  }

  /**
   * @param {String} objPath
   * @param {String|*} data
   * @param {Function} cb
   */
  putObj(objPath, data, cb) {
    this._request('putObj', objPath, (error, data) => {
      cb(error || data.error);
    }, data);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  deleteObj(objPath, cb) {
    this._request('deleteObj', objPath, (error, data) => {
      cb(error || data.error);
    });
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  lockObj(objPath, cb) {
    this.putObj(ApiDriver._lockObjPath(objPath), '', cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  isObjLocked(objPath, cb) {
    this.hasObj(ApiDriver._lockObjPath(objPath), cb);
  }

  /**
   * @param {String} objPath
   * @param {Function} cb
   */
  releaseObjLock(objPath, cb) {
    this.deleteObj(ApiDriver._lockObjPath(objPath), cb);
  }

  /**
   * @param {String} objPath
   * @returns {String}
   * @private
   */
  static _lockObjPath(objPath) {
    return `${path.dirname(objPath)}/.${path.basename(objPath)}.lock`;
  }

  /**
   * @param {String} endpointName
   * @param {String} objPath
   * @param {Function} cb
   * @param {Object|null} data
   * @private
   */
  _request(endpointName, objPath, cb, data = null) {
    let payload = {objPath,};

    if (data) {
      payload.data = (new Buffer(data.toString())).toString('base64');
    }

    let requestData = {
      uri: this._endpoints[endpointName],
      method: 'POST',
      retry: ApiDriver.RETRY_COUNT,
      displayName: `POST:${endpointName}`,
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify(payload),
    };

    request(requestData)
      .then((response) => {
        try {
          let parsedData = null;
          let data = response.safeJson(() => {
            return ApiDriver._decodeData(response.text().then((s) => s.toString()));
          });

          if (data.errorMessage) {
            cb(ApiDriver._extractError(data.errorMessage), null);
            return;
          }

          parsedData = util.isObject(parsedData) ? parsedData : {};

          // mimic callback args
          parsedData.data = parsedData.data || null;
          parsedData.error = parsedData.error || null;

          if (!parsedData.data && !parsedData.error) {
            parsedData.error = new Error('Missing result data');
          } else if (parsedData.error) {
            parsedData.error = ApiDriver._extractError(parsedData.error);
          }

          cb(null, parsedData);
        } catch (error) {
          cb(error, null);
        }
      }).catch((error) => {
        cb(error, null);
      });
  }

  /**
   * @param {String|Object} data
   * @returns {Object}
   * @private
   */
  static _decodeData(data) {
    if (util.isObject(data)) {
      return data;
    }

    try {
      return JSON.parse(data);
    } catch (e) {
    }

    return {};
  }

  /**
   * @param {String} rawErrorData
   * @returns {Error}
   * @private
   */
  static _extractError(rawErrorData) {
    if (util.isObject(rawErrorData)) {
      return new Error(
        rawErrorData.errorMessage.toString() ||
        `An unknown error occurred (${JSON.stringify(rawErrorData)})`
      );
    }

    let errorMsg = rawErrorData;

    try {
      let errorObj = JSON.parse(rawErrorData);

      errorMsg = errorObj.errorMessage || `An unknown error occurred (${rawErrorData})`;
    } catch (error) {
    }

    return new Error(errorMsg);
  }

  /**
   * @returns {Number}
   */
  static get RETRY_COUNT() {
    return 3;
  }
}
