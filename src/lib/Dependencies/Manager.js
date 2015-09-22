/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {AbstractDriver} from './Driver/AbstractDriver';
import Core from '@mitocgroup/deep-core';
import {Resolver} from './Resolver';
import {Uploader} from './Uploader';
import {WaitFor} from '../Helpers/WaitFor';
import Path from 'path';
import {Instance as Microservice} from '../Microservice/Instance';
import {FrontendEngine} from '../Microservice/FrontendEngine';
import {NoMatchingFrontendEngineException} from './Exception/NoMatchingFrontendEngineException';

/**
 * Dependencies manager
 */
export class Manager {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    if (!(driver instanceof AbstractDriver)) {
      throw new Core.Exception.InvalidArgumentException(driver, 'AbstractDriver');
    }

    this._driver = driver;

    this._uploader = new Uploader(this._driver);
    this._resolver = new Resolver(this._driver);
  }

  /**
   * @returns {Uploader}
   */
  get uploader() {
    return this._uploader;
  }

  /**
   * @returns {Resolver}
   */
  get resolver() {
    return this._resolver;
  }

  /**
   * @returns {AbstractDriver}
   */
  get driver() {
    return this._driver;
  }

  /**
   * @param {String[]} subPaths
   * @param {Function} callback
   */
  pushBatch(subPaths, callback) {
    this._executeBatch(subPaths, this._uploader, callback);
  }

  /**
   * @param {String[]} subPaths
   * @param {Function} callback
   */
  pullBatch(subPaths, callback) {
    this._executeBatch(subPaths, this._resolver, callback);
  }

  /**
   * @param {String[]} subPaths
   * @param {Function} executor
   * @param {Function} callback
   * @private
   */
  _executeBatch(subPaths, executor, callback) {
    let wait = new WaitFor();
    let stackSize = subPaths.length;

    for (let subPath of subPaths) {
      executor.dispatch(this._createMicroservice(subPath), function() {
        stackSize--;
      }.bind(this));
    }

    wait.push(function() {
      return stackSize <= 0;
    }.bind(this));

    wait.ready(function() {
      callback();
    }.bind(this));
  }

  /**
   * @param {String} subPath
   * @param {Function} callback
   * @returns {Resolver}
   */
  pushSingle(subPath, callback) {
    return this._uploader.dispatch(this._createMicroservice(subPath), callback);
  }

  /**
   * @param {String} subPath
   * @param {Function} callback
   * @returns {Resolver}
   */
  pullSingle(subPath, callback) {
    return this._resolver.dispatch(this._createMicroservice(subPath), callback);
  }

  /**
   * @param {String} subPath
   * @returns {Microservice}
   * @private
   */
  _createMicroservice(subPath) {
    return Microservice.create(Path.join(this._driver.basePath, subPath));
  }

  /**
   * @param {Function} callback
   * @returns {Uploader}
   */
  push(callback) {
    return this._uploader.dispatchBatch(callback);
  }

  /**
   * @param {Function} callback
   * @param {Boolean} pullFrontendEngine
   * @returns {Resolver}
   */
  pull(callback, pullFrontendEngine = true) {
    return this._resolver.dispatchBatch(pullFrontendEngine ? () => {
      // @todo: move root microservice resolver?
      let frontendEngineManager = new FrontendEngine();
      let microservices = this._resolver.refresh().microservices;

      let suitableEngine = frontendEngineManager.findSuitable(...microservices);

      if (!suitableEngine) {
        throw new NoMatchingFrontendEngineException(frontendEngineManager.rawEngines);
      }

      let payload = {};

      // @todo: specify certain version of frontendEngine
      payload[FrontendEngine.getRealEngine(suitableEngine)] = FrontendEngine.getLatestEngineVersion(suitableEngine);

      this._resolver._pull(payload, callback);
    } : callback);
  }
}
