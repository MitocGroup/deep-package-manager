/**
 * Created by AlexanderC on 9/18/15.
 */

'use strict';

import {Dependency as GitHubDependency} from '../Registry/GitHub/Dependency';
import path from 'path';

export class FrontendEngine {
  /**
   * @param {String[]} engines
   */
  constructor(...engines) {
    this._rawEngines = engines.length ? engines : FrontendEngine.engines;
    this._engines = this._rawEngines.map(FrontendEngine.getRealEngine);
  }

  /**
   * @param {Object} microservice
   */
  static create(microservice) {
    return new FrontendEngine(...microservice.config.frontendEngine);
  }

  /**
   * @returns {String[]}
   */
  get rawEngines() {
    return this._rawEngines;
  }

  /**
   * @returns {String[]}
   */
  get engines() {
    return this._engines;
  }

  /**
   * @param {Property|Instance|*} property
   * @param {String} suitableEngine
   * @param {Function} cb
   */
  static fetch(property, suitableEngine, cb) {
    let repo = FrontendEngine.getEngineGitHub(suitableEngine);
    let dependency = new GitHubDependency(repo, '*');

    dependency.extract(path.join(property.path, FrontendEngine.getRealEngine(suitableEngine)), cb);
  }

  /**
   * @param {String} engine
   * @returns {String}
   */
  static getEngineGitHub(engine) {
    let depName = null;

    switch (engine) {
      case FrontendEngine.ANGULAR_ENGINE:
        depName = GitHubDependency.getDepName(
          FrontendEngine.GITHUB_DEEP_USER,
          `${FrontendEngine.GITHUB_REPO_PREFIX}angularjs`
        );
        break;
    }

    return depName;
  }

  /**
   * @param {Object[]} microservices
   * @returns {String}
   */
  findSuitable(...microservices) {
    let engines = microservices.map((microservice) => microservice.frontendEngine);
    let plainEnginesBatch = [];

    for (let i in engines) {
      if (!engines.hasOwnProperty(i)) {
        continue;
      }

      plainEnginesBatch.concat(engines[i].engines);
    }

    plainEngineLoop: for (let i in this._rawEngines) {
      if (!this._rawEngines.hasOwnProperty(i)) {
        continue;
      }

      let plainEngine = this._rawEngines[i];

      for (let j in plainEnginesBatch) {
        if (!plainEnginesBatch.hasOwnProperty(j)) {
          continue;
        }

        if (plainEnginesBatch[j].indexOf(plainEngine) === -1) {
          continue plainEngineLoop;
        }
      }

      return plainEngine;
    }

    return null;
  }

  /**
   * @param {String} engine
   * @returns {Boolean}
   */
  match(engine) {
    let realEngine = FrontendEngine.getRealEngine(engine);

    return this._engines.indexOf(realEngine) !== -1;
  }

  /**
   * @param {String} engine
   * @returns {String}
   */
  static getRealEngine(engine) {
    switch (engine) {
      case FrontendEngine.ANGULAR_ENGINE:
        engine = 'ng';
        break;
    }

    return `deep.${engine}.root`;
  }

  /**
   * @returns {String[]}
   */
  static get engines() {
    return [FrontendEngine.ANGULAR_ENGINE];
  }

  /**
   * @returns {String}
   */
  static get ANGULAR_ENGINE() {
    return 'angular';
  }

  /**
   * @returns {String}
   */
  static get GITHUB_DEEP_USER() {
    return 'MitocGroup';
  }

  /**
   * @returns {String}
   */
  static get GITHUB_REPO_PREFIX() {
    return 'deep-microservices-root-';
  }
}
