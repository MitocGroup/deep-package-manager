/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import StringUtils from 'underscore.string';
import Path from 'path';
import FileSystem from 'fs';

/**
 * Autoloading directories of a microservice
 */
export class Autoload {
  /**
   * @param {Object} rawConfig
   * @param {String} basePath
   */
  constructor(rawConfig, basePath) {
    let frontend = StringUtils.trim(rawConfig.frontend, '/');
    let backend = StringUtils.trim(rawConfig.backend, '/');
    let docs = StringUtils.trim(rawConfig.docs, '/');
    let models = StringUtils.trim(rawConfig.models, '/');

    this._frontend = this._getBuildAwareFrontendPath(`${basePath}/${frontend}`);
    this._backend = `${basePath}/${backend}`;
    this._docs = `${basePath}/${docs}`;
    this._models = `${basePath}/${models}`;
  }

  /**
   * @todo think on removing this
   *
   * Skip _build path if exists
   */
  static _skipBuild() {
    Autoload.__skipBuild = true;
  }

  /**
   * @param {String} path
   * @returns {String}
   * @private
   */
  _getBuildAwareFrontendPath(path) {
    // @todo: remove this hook
    if (Autoload.__skipBuild) {
      return path;
    }

    let buildPath = Path.join(path, Autoload.BUILD_FOLDER);

    try {
      let buildStats = FileSystem.lstatSync(buildPath);

      if (buildStats.isDirectory()) {
        return buildPath;
      }
    } catch (e) {
      // do nothing...
    }

    return path;
  }

  /**
   * Get UI directory
   *
   * @returns {String}
   */
  get frontend() {
    return this._frontend;
  }

  /**
   * Get backend directory
   *
   * @returns {String}
   */
  get backend() {
    return this._backend;
  }

  /**
   * Get docs directory
   *
   * @returns {String}
   */
  get docs() {
    return this._docs;
  }

  /**
   * Get models directory
   *
   * @returns {String}
   */
  get models() {
    return this._models;
  }

  /**
   * @returns {Object}
   */
  extract() {
    return {
      frontend: this._frontend,
      backend: this._backend,
      docs: this._docs,
      models: this._models,
    };
  }

  /**
   * @returns {String}
   */
  static get BUILD_FOLDER() {
    return '_build';
  }
}

Autoload.__skipBuild = false;
