/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {ActionFlags} from './Helpers/ActionFlags';

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
    this._scope = ActionFlags.unstringify(config.scope);
    this._cron = config.cron || null;
    this._cronPayload = config.cronPayload || null;
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
   * @returns {String}
   */
  static get AUTH_TYPE_AWS_IAM() {
    return 'AWS_IAM';
  }

  /**
   * @returns {String}
   */
  static get AUTH_TYPE_NONE() {
    return 'NONE';
  }

  /**
   * @returns {String[]}
   */
  static get API_AUTH_TYPES() {
    return [
      Action.AUTH_TYPE_AWS_IAM,
      Action.AUTH_TYPE_NONE,
    ];
  }

  /**
   * @returns {Number}
   */
  get scope() {

    // It doesn't make sense to expose scheduled backend
    // through both api and direct call due to missing user context
    if (this.cron) {
      return ActionFlags.PRIVATE;
    }

    return this._scope;
  }

  /**
   * @returns {String|Object|Function|null}
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

    // @todo: remove this after figuring out the invoke roles
    // for both auth and non auth policies assigned to the cognito
    if (!ActionFlags.isDirect(this.scope)) {
      return false;
    }

    // There's no user context shared in scheduled backend
    if (this.cron) {
      return false;
    }

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
   * @returns {String|null}
   */
  get cron() {
    return this._cron;
  }

  /**
   * @returns {Object|null}
   */
  get cronPayload() {
    return this._cronPayload;
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
      scope: this.scope,
      cron: this.cron,
      cronPayload: this.cronPayload,
    };
  }
}
