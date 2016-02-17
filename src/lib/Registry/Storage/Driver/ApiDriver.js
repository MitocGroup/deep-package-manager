/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import request from 'fetchy-request';
import {Hash} from '../../../Helpers/Hash';
import util from '../../../Helpers/util';
import {RegistryAutoDiscovery} from './Helpers/Api/RegistryAutoDiscovery';
import path from 'path';

export class ApiDriver extends AbstractDriver {
  /**
   * @param {RegistryConfig|*} registryConfig
   */
  constructor(registryConfig) {
    super();

    this._authorizer = null;
    this._registryConfig = registryConfig;
    this._endpoints = registryConfig.extract();
  }

  /**
   * @param {String} baseHost
   * @param {Function} cb
   * @param {Boolean} cached
   */
  static autoDiscover(baseHost, cb, cached = false) {
    (new RegistryAutoDiscovery(baseHost))
      [cached ? 'discoverCached' : 'discover']((error, registryConfig) => {
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
   * @returns {Authorizer|null}
   */
  get authorizer() {
    return this._authorizer;
  }

  /**
   * @param {Authorizer|null} authorizer
   */
  set authorizer(authorizer) {
    this._authorizer = authorizer;
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
      payload.data = ApiDriver._encodeResponseData(endpointName, data);
    }

    let requestData = {
      uri: this._endpoints[endpointName],
      method: 'POST',
      retry: ApiDriver.RETRY_COUNT,
      displayName: `POST:${endpointName}`,
      headers: {'Content-Type': 'application/json',},
      body: JSON.stringify(payload),
    };

    if (this._authorizer) {
      this._authorizer.injectIntoRequest(requestData);
    }

    request(requestData)
      .then((response) => {
        response
          .text()
          .then((plainData) => {
            let data = null;
            let parsedData = null;

            try {
              data = JSON.parse(plainData);
            } catch (error) {
              data = ApiDriver._decodeData(plainData);
            }

            if (data.errorMessage) {
              cb(ApiDriver._extractError(data.errorMessage), null);
              return;
            }

            parsedData = util.isObject(data) ? data : {};

            // mimic callback args
            parsedData.data = ApiDriver._decodeResponseData(endpointName, parsedData.data || null);
            parsedData.error = parsedData.error || null;

            if (!parsedData.data && !parsedData.error) {
              parsedData.error = new Error('Missing result data');
            } else if (parsedData.error) {
              parsedData.error = ApiDriver._extractError(parsedData.error);
            }

            cb(null, parsedData);
          })
          .catch((error) => {
            cb(error, null);
          });
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
   * @param {String} endpointName
   * @param {String|*} data
   * @returns {String|*}
   */
  static _encodeResponseData(endpointName, data) {
    if (endpointName !== 'putObj') {
      return data;
    }

    return data ? (new Buffer(data.toString())).toString('base64') : data;
  }

  /**
   * @param {String} endpointName
   * @param {String|*} rawData
   * @returns {String|*}
   */
  static _decodeResponseData(endpointName, rawData) {
    if (endpointName !== 'putObj') {
      return rawData;
    }

    return rawData ? (new Buffer(rawData.toString(), 'base64')).toString('ascii') : rawData;
  }

  /**
   * @returns {Number}
   */
  static get RETRY_COUNT() {
    return 3;
  }
}
