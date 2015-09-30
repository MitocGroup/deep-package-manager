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
   * @returns {Object}
   */
  get engine() {
    return this._engine;
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
    };
  }
}
