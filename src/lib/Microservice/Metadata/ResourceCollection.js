/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from './Action';
import {Instance as Microservice} from '../Instance';
import StringUtils from 'underscore.string';
import Joi from 'joi';
import deepActionSchema from './action.schema';
import {InvalidConfigException} from '../Exception/InvalidConfigException';
import {InvalidArgumentException} from '../../Exception/InvalidArgumentException';
import JsonFile from 'jsonfile';

/**
 * Resource loader for microservice
 */
export class ResourceCollection {
  /**
   * @param {Object} rawResources
   */
  constructor(rawResources) {
    if (!(rawResources instanceof Object)) {
      throw new InvalidArgumentException(rawResources, 'Object');
    }

    this._actions = [];
    this._rawResources = rawResources;

    for (let resourceName in rawResources) {
      if (!rawResources.hasOwnProperty(resourceName)) {
        continue;
      }

      let resourceActions = rawResources[resourceName];

      for (let actionName in resourceActions) {
        if (!resourceActions.hasOwnProperty(actionName)) {
          continue;
        }

        let configObject = Joi.validate(resourceActions[actionName], deepActionSchema);

        if (configObject.error) {
          let configError = configObject.error;

          throw new InvalidConfigException(
            `Invalid resource action config for ${resourceName}:${actionName} provided: ${configError}`
          );
        }

        this._actions.push(new Action(resourceName, actionName, configObject.value));
      }
    }
  }

  /**
   * @param {String} backendPath
   * @param {Boolean} strict
   */
  static create(backendPath, strict = false) {
    backendPath = StringUtils.rtrim(backendPath, '/');

    let resourcesFile = `${backendPath}/${Microservice.RESOURCES_FILE}`;

    let rawResources = {};

    // @todo: do we have to enable strict mode?
    try {
      rawResources = JsonFile.readFileSync(resourcesFile);
    } catch (e) {
      if (strict) {
        throw e;
      }
    }

    return new ResourceCollection(rawResources);
  }

  /**
   * @returns {Object}
   */
  extract() {
    let resources = {};

    for (let resourceAction of this._actions) {
      if (!resources[resourceAction.resourceName]) {
        resources[resourceAction.resourceName] = {};
      }

      resources[resourceAction.resourceName][resourceAction.name] = resourceAction.extract();
    }

    return resources;
  }

  /**
   * @returns {Array}
   */
  get actions() {
    return this._actions;
  }

  /**
   * @returns {Object}
   */
  get rawResources() {
    return this._rawResources;
  }
}
