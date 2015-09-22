/**
 * Created by AlexanderC on 9/18/15.
 */

'use strict';

export class FrontendEngine {
  /**
   * @param {String[]} engines
   */
  constructor(...engines) {
    this._rawEngines = engines || FrontendEngine.engines;
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
   * @param {String} engine
   * @returns {String}
   *
   * @todo: get versions dynamically!
   */
  static getLatestEngineVersion(engine) {
    return '0.0.1';
  }

  /**
   * @param {Object[]} microservices
   * @returns {String}
   */
  findSuitable(...microservices) {
    let engines = microservices.map((microservice) => microservice.frontendEngine);
    let plainEngines = [];

    for (let engine of engines) {
      plainEngines.concat(engine.engines);
    }

    plainEngineLoop: for (let plainEngine of plainEngines) {
      for (let engine of engines) {
        if (!engine.match(plainEngine)) {
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
    let realEngines = FrontendEngine.getRealEngine(engine);

    return this._engines.indexOf(realEngines) !== -1;
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
}
