/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import {RegistryConfig} from './RegistryConfig';
import request from 'fetchy-request';

export class RegistryAutoDiscovery {
  /**
   * @param {String} baseHost
   */
  constructor(baseHost) {
    this._baseHost = baseHost;

    this._discoveryFileLocation = RegistryAutoDiscovery._getDiscoveryFileLocation(baseHost);
  }

  /**
   * @param {Function} cb
   * @returns {RegistryAutoDiscovery}
   */
  discover(cb) {
    request(this._discoveryFileLocation)
      .then((response) => {
        try {
          cb(null, new RegistryConfig(response.json().toString()));
        } catch (error) {
          cb(error, null);
        }
      })
      .catch((error) => {
        cb(error, null);
      });

    return this;
  }

  /**
   * @returns {String}
   */
  get baseHost() {
    return this._baseHost;
  }

  /**
   * @returns {String}
   */
  get discoveryFileLocation() {
    return this._discoveryFileLocation;
  }

  /**
   * @returns {String}
   * @private
   */
  static _getDiscoveryFileLocation(baseHost) {
    let uri = baseHost;

    if (!/^https?:\/\//i.test(uri)) {
      uri = `http://${uri}`;
    }

    if (!/\/$/.test(uri)) {
      uri += '/';
    }

    return `${uri}${RegistryAutoDiscovery.AUTO_DISCOVERY_FILE}`;
  }

  /**
   * @returns {String}
   */
  static AUTO_DISCOVERY_FILE() {
    return 'registry.json';
  }
}