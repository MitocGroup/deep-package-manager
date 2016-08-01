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
   * @param {Number} cacheTtl For one hour by default
   * @returns {RegistryAutoDiscovery}
   */
  discoverCached(cb, cacheFile = null, cacheTtl = 3600) {
    cacheFile = cacheFile || this.DEFAULT_CACHE_FILE;

    if (!fs.existsSync(cacheFile)) {
      this.discover((error, registryConfig) => {
        if (error) {
          cb(error, null);
          return;
        }

        fse.outputJson(cacheFile, {exp: RegistryAutoDiscovery._ts + cacheTtl, cfg: registryConfig.rawConfig}, () => {

          // @todo: fail on the error?
          cb(null, registryConfig);
        });
      });

      return this;
    }

    fse.readJson(cacheFile, (error, registryRawConfig) => {
      if (error || !registryRawConfig.exp || registryRawConfig.exp <= RegistryAutoDiscovery._ts) {
        fse.removeSync(cacheFile);
        this.discoverCached(cb, cacheFile);
        return;
      }

      cb(null, new RegistryConfig(registryRawConfig.cfg));
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @returns {RegistryAutoDiscovery}
   */
  discover(cb) {
    request({
      uri: this._discoveryFileLocation,
      timeout: 3000, // @todo: make it configurable?
    })
      .then((response) => {
        if (!response.ok) {
          cb(response._error || new Error(response.statusText), null);
          return;
        }

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
   * @param {String} baseHost
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
  get DEFAULT_CACHE_FILE() {
    let baseHostEscaped = this._baseHost
      .replace(/^https?:\/\//i, '')
      .replace(/([^a-z0-9\._\-]+)/i, '-');

    return path.join(
      RegistryAutoDiscovery.DEFAULT_CONFIG_DIR,
      `${baseHostEscaped}-${RegistryAutoDiscovery.AUTO_DISCOVERY_FILE}`
    );
  }

  /**
   * @returns {Number}
   * @private
   */
  static get _ts() {
    return Math.ceil((new Date()).getTime() / 1000);
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_CONFIG_DIR() {
    return path.join(RegistryAutoDiscovery._homeDir, '.deepRegistry');
  }

  /**
   * @returns {String}
   * @private
   */
  static get _homeDir() {
    return (os.homedir && os.homedir()) || process.env.HOME || process.env.USERPROFILE;
  }

  /**
   * @returns {String}
   */
  static get AUTO_DISCOVERY_FILE() {
    return 'registry.json';
  }
}
