/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import {RegistryConfig} from './RegistryConfig';
import request from 'fetchy-request';
import os from 'os';
import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';

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
   * @param {String|null} cacheFile
   * @returns {RegistryAutoDiscovery}
   */
  discoverCached(cb, cacheFile = null) {
    cacheFile = cacheFile || RegistryAutoDiscovery.DEFAULT_CACHE_FILE;

    if (!fs.existsSync(cacheFile)) {
      this.discover((error, registryConfig) => {
        if (error) {
          cb(error, null);
          return;
        }

        fse.outputJson(cacheFile, registryConfig.rawConfig, () => {

          // @todo: fail on the error?
          cb(null, registryConfig);
        });
      });

      return this;
    }

    fse.readJson(cacheFile, (error, registryRawConfig) => {
      if (error) {
        fse.removeSync(cacheFile);
        this.discoverCached(cb, cacheFile);
        return;
      }

      cb(null, new RegistryConfig(registryRawConfig));
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @returns {RegistryAutoDiscovery}
   */
  discover(cb) {
    request(this._discoveryFileLocation)
      .then((response) => {
        response
          .text()
          .then((plainJson) => {
            try {
              cb(null, new RegistryConfig(JSON.parse(plainJson.toString())));
            } catch (error) {
              cb(error, null);
            }
          })
          .catch((error) => {
            cb(error, null);
          });
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
  static get DEFAULT_CACHE_FILE() {
    return path.join((os.homedir || (() => '~/'))(), '.deepRegistry', RegistryAutoDiscovery.AUTO_DISCOVERY_FILE);
  }

  /**
   * @returns {String}
   */
  static get AUTO_DISCOVERY_FILE() {
    return 'registry.json';
  }
}
