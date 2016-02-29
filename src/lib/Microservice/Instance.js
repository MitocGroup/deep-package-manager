/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Config} from './Config';
import {Parameters} from './Parameters';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {Autoload} from './Metadata/Autoload';
import {ResourceCollection} from './Metadata/ResourceCollection';
import {Compiler} from '../Compilation/Compiler';
import {PostDeployHook} from './PostDeployHook';
import {InitHook} from './InitHook';
import {FrontendEngine} from './FrontendEngine';
import path from 'path';

/**
 * Microservice instance
 */
export class Instance {
  /**
   * @param {Config} config
   * @param {Parameters} parameters
   * @param {String} basePath
   */
  constructor(config, parameters, basePath) {
    if (!(config instanceof Config)) {
      throw new InvalidArgumentException(config, Config);
    }

    if (!(parameters instanceof Parameters)) {
      throw new InvalidArgumentException(parameters, Parameters);
    }

    this._basePath = path.normalize(basePath);
    this._config = config.extract();
    this._parameters = parameters.extract();
    this._autoload = new Autoload(this._config.autoload, this._basePath);
    this._resources = null;

    this._postDeployHook = new PostDeployHook(this);
    this._initHook = new InitHook(this);

    this._property = null;
  }

  /**
   * @returns {Property|Instance|null}
   */
  get property() {
    return this._property;
  }

  /**
   * @param {Property|Instance|null} property
   */
  set property(property) {
    this._property = property;
  }

  /**
   * @returns {String}
   */
  static get CONFIG_FILE() {
    return 'deepkg.json';
  }

  /**
   * @returns {String}
   */
  static get PARAMS_FILE() {
    return 'parameters.json';
  }

  /**
   * @returns {String}
   */
  static get RESOURCES_FILE() {
    return 'resources.json';
  }

  /**
   * @param {String} basePath
   */
  static create(basePath) {
    basePath = path.normalize(basePath);

    let configFile = path.join(basePath, Instance.CONFIG_FILE);
    let parametersFile = path.join(basePath, Instance.PARAMS_FILE);

    return new Instance(
      Config.createFromJsonFile(configFile),
      Parameters.createFromJsonFile(parametersFile),
      basePath
    );
  }

  /**
   * @returns {FrontendEngine}
   */
  get frontendEngine() {
    return FrontendEngine.create(this);
  }

  /**
   * @returns {String}
   */
  get identifier() {
    return this._config.identifier;
  }

  /**
   * @returns {String}
   */
  get version() {
    return this._config.version;
  }

  /**
   *
   * @returns {String}
   */
  get basePath() {
    return this._basePath;
  }

  /**
   * Compiles dependencies recursively
   *
   * @param {Boolean} lambdasOnly
   */
  compile(lambdasOnly = false) {
    if (!lambdasOnly) {
      Compiler.compile(this);
    }

    this._config.lambdas = Compiler.buildLambdas(this);
  }

  /**
   * @returns {Boolean}
   */
  get isRoot() {
    return !!this._config.propertyRoot;
  }

  /**
   * Retrieve microservice configuration
   *
   * @returns {Config}
   */
  get config() {
    return this._config;
  }

  /**
   * @returns {Parameters}
   */
  get parameters() {
    return this._parameters;
  }

  /**
   * @returns {Autoload}
   */
  get autoload() {
    return this._autoload;
  }

  /**
   * @returns {Function}
   */
  get initHook() {
    return this._initHook.getHook();
  }

  /**
   * @returns {Function}
   */
  get postDeployHook() {
    return this._postDeployHook.getHook();
  }

  /**
   * @returns {ResourceCollection}
   */
  get resources() {
    if (this._resources === null) {
      this._resources = ResourceCollection.create(this._autoload.backend);
    }

    return this._resources;
  }
}
