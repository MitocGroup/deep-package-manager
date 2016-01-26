/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import path from 'path';
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
    let frontend = path.normalize(rawConfig.frontend);
    let backend = path.normalize(rawConfig.backend);
    let docs = path.normalize(rawConfig.docs);
    let models = path.normalize(rawConfig.models);
    let validation = path.normalize(rawConfig.validation);
    let fixtures = path.normalize(rawConfig.fixtures);
    let migration = path.normalize(rawConfig.migration);

    this._frontend = this._getBuildAwareFrontendPath(path.join(basePath, frontend));
    this._backend = path.join(basePath, backend);
    this._docs = path.join(basePath, docs);
    this._models = path.join(basePath, models);
    this._validation = path.join(basePath, validation);
    this._fixtures = path.join(basePath, fixtures);
    this._migration = path.join(basePath, migration);
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
   * @param {String} frontendPath
   * @returns {String}
   * @private
   */
  _getBuildAwareFrontendPath(frontendPath) {
    // @todo: remove this hook
    if (Autoload.__skipBuild) {
      return frontendPath;
    }

    let buildPath = path.join(frontendPath, Autoload.BUILD_FOLDER);

    try {
      let buildStats = FileSystem.lstatSync(buildPath);

      if (buildStats.isDirectory()) {
        return buildPath;
      }
    } catch (e) {
      // do nothing...
    }

    return frontendPath;
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
   * Get migrations directory
   *
   * @returns {String}
   */
  get migration() {
    return this._migration;
  }

  /**
   * Get fixtures directory
   *
   * @returns {String}
   */
  get fixtures() {
    return this._fixtures;
  }

  /**
   * Get validation schemas directory
   *
   * @returns {String}
   */
  get validation() {
    return this._validation;
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
      validation: this._validation,
      fixtures: this._fixtures,
      migration: this._migration,
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
