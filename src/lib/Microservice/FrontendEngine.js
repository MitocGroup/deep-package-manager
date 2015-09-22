/**
 * Created by AlexanderC on 9/18/15.
 */

'use strict';

export class FrontendEngine {
  /**
   * @param {String[]} engines
   */
  constructor(...engines) {
    this._rawEngines = engines;
    this._engines = engines.map(FrontendEngine._getRealEngine);
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
    let realEngines = FrontendEngine._getRealEngine(engine);

    return this._engines.indexOf(realEngines) !== -1;
  }

  /**
   * @param {String} engine
   * @returns {String}
   * @private
   */
  static _getRealEngine(engine) {
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
