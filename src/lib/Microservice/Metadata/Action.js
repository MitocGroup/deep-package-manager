/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

/**
 * Single action instance
 */
export class Action {
  /**
   * @param {String} resourceName
   * @param {String} actionName
   * @param {Object} config
   */
  constructor(resourceName, actionName, config) {
    this._resourceName = resourceName;
    this._name = actionName;
    this._description = config.description;
    this._type = config.type;
    this._methods = config.methods.map(m => m.toUpperCase());
    this._source = config.source;
    this._engine = config.engine;
    this._cacheTtl = config.cacheTtl;
    this._forceUserIdentity = config.forceUserIdentity;
    this._validationSchema = config.validationSchema;
  }

  /**
   * @returns {Array}
   */
  static get HTTP_VERBS() {
    return ['GET', 'POST', 'DELETE', 'HEAD', 'PUT', 'OPTIONS', 'PATCH'];
  }

  /**
   * @returns {String}
   */
  static get LAMBDA() {
    return 'lambda';
  }

  /**
   * @returns {String}
   */
  static get EXTERNAL() {
    return 'external';
  }

  /**
   * @returns {Array}
   */
  static get TYPES() {
    return [
      Action.LAMBDA,
      Action.EXTERNAL,
    ];
  }

  /**
   * @returns {String|null}
   */
  get validationSchema() {
    return this._validationSchema;
  }

  /**
   * @returns {Boolean}
   */
  get cacheEnabled() {
    return this._cacheTtl !== Action.NO_CACHE;
  }

  /**
   * @returns {Boolean}
   */
  get forceUserIdentity() {
    return this._forceUserIdentity;
  }

  /**
   * @returns {Number}
   */
  get cacheTtl() {
    return this._cacheTtl;
  }

  /**
   * @returns {Object}
   */
  get engine() {
    return this._engine;
  }

  /**
   * @returns {String}
   */
  get resourceName() {
    return this._resourceName;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get identifier() {
    return `${this.resourceName}-${this.name}`;
  }

  /**
   * @returns {String}
   */
  get description() {
    return this._description;
  }

  /**
   * @returns {String}
   */
  get type() {
    return this._type;
  }

  /**
   * @returns {Array}
   */
  get methods() {
    return this._methods;
  }

  /**
   * @returns {String}
   */
  get source() {
    return this._source;
  }

  /**
   * @returns {Number}
   * @constructor
   */
  static get CACHE_FOREVER() {
    return 0;
  }

  /**
   * @returns {Number}
   * @constructor
   */
  static get NO_CACHE() {
    return -1;
  }

  /**
   * @returns {Object}
   */
  extract() {
    return {
      identifier: this.identifier,
      resourceName: this.resourceName,
      name: this.name,
      description: this.description,
      type: this.type,
      source: this.source,
      methods: this.methods,
      engine: this.engine,
      cacheEnabled: this.cacheEnabled,
      cacheTtl: this.cacheTtl,
      forceUserIdentity: this.forceUserIdentity,
      validationSchema: this.validationSchema,
    };
  }
}
