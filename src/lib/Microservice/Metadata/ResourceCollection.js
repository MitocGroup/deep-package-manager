/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from './Action';
import {Instance as Microservice} from '../Instance';
import Joi from 'joi';
import path from 'path';
import deepActionSchema from './action.schema';
import {InvalidConfigException} from '../Exception/InvalidConfigException';
import {InvalidArgumentException} from '../../Exception/InvalidArgumentException';
import JsonFile from 'jsonfile';
import {DeployIgnore} from '../../Property/DeployIgnore';

/**
 * Resource loader for microservice
 */
export class ResourceCollection {
  /**
   * @param {Object} rawResources
   * @param {String} msIdentifier
   * @param {DeployIgnore} deployIgnore
   */
  constructor(rawResources, msIdentifier, deployIgnore) {
    if (!(rawResources instanceof Object)) {
      throw new InvalidArgumentException(rawResources, 'Object');
    }

    this._actions = [];
    this._rawResources = rawResources;
    this._deployIgnore = deployIgnore;
    this._msIdentifier = msIdentifier;

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

        let resourceIdentifier = `${msIdentifier}:${resourceName}:${actionName}`;

        if (this._deployIgnore.keep(DeployIgnore.RESOURCE, resourceIdentifier)) {
          this._actions.push(new Action(resourceName, actionName, configObject.value));
        }
      }
    }
  }

  /**
   * @param {Microservice/Instance} microservice
   * @param {Boolean} strict
   * @returns {ResourceCollection}
   */
  static create(microservice, strict = false) {
    let backendPath = microservice.autoload.backend;
    let resourcesFile = path.join(backendPath, Microservice.RESOURCES_FILE);
    let rawResources = {};

    // @todo: do we have to enable strict mode?
    try {
      rawResources = JsonFile.readFileSync(resourcesFile);
    } catch (e) {
      if (strict) {
        throw e;
      }
    }

    return new ResourceCollection(
      rawResources, 
      microservice.identifier, 
      microservice.property.deployIgnore
    );
  }

  /**
   * @returns {Object}
   */
  extract() {
    let resources = {};

    for (let i in this._actions) {
      if (!this._actions.hasOwnProperty(i)) {
        continue;
      }

      let resourceAction = this._actions[i];

      if (!resources[resourceAction.resourceName]) {
        resources[resourceAction.resourceName] = {};
      }

      let resourceIdentifier = `${this._msIdentifier}:${resourceAction.resourceName}:${resourceAction.name}`;

      if (this._deployIgnore.keep(DeployIgnore.RESOURCE, resourceIdentifier)) {
        resources[resourceAction.resourceName][resourceAction.name] = resourceAction.extract();
      }
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
