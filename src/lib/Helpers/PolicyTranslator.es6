/**
 * Created by mgoria on 5/27/16.
 */

'use strict';

import {Helpers_Hash} from 'deep-package-manager';
import {LambdaService} from '../Provisioning/Service/LambdaService';
import {Inflector} from './Inflector';
import Core from 'deep-core';

export class PolicyTranslator {
  /**
   * @param {Property/Instance} property
   * @param {Object} backendConfig
   */
  constructor(property, backendConfig = null) {
    this._property = property;
    this._backendConfig = backendConfig || property.config;
  }

  /**
   * @param {Object} policy
   * @returns {Core.AWS.IAM.Policy}
   */
  toIAMPolicy(policy) {
    let iamPolicy = new Core.AWS.IAM.Policy();

    policy.Statement.forEach(rawDeepStmt => {
      let iamStmt = iamPolicy.statement.add();

      iamStmt.effect = rawDeepStmt.Effect;
      iamStmt.action.add(Core.AWS.Service.LAMBDA, 'InvokeFunction');

      rawDeepStmt.Action.map(this._resolveDeepAction.bind(this)).forEach(functionName => {
        iamStmt.resource.add(
          Core.AWS.Service.LAMBDA,
          this._backendConfig.awsRegion,
          this._backendConfig.awsAccountId,
          `function:${functionName}`
        );
      });
    });

    return iamPolicy;
  }

  /**
   * msId:*
   * msId:resourceName:*
   * msId:resourceName:actionName
   * 
   * @param {String} action
   * @private
   */
  _resolveDeepAction(action) {
    if (typeof action != 'string') {
      throw new TypeError(`Invalid action parameter type. Expected string got ${typeof action}`);
    }

    let lambdaService = this._property.provisioning.services.find(LambdaService);

    if (action === PolicyTranslator.ANY) {
      return lambdaService._getGlobalResourceMask();
    }

    let actionParts = action.split(':');

    actionParts[1] = actionParts[1] || PolicyTranslator.ANY;
    actionParts[2] = actionParts[2] || PolicyTranslator.ANY;

    if (!this._actionsExists(actionParts)) {
      throw new Error(`'${action}' deep action doesn't exists`);
    }

    let microserviceIdentifier = actionParts.shift();
    let lambdaFunctionName = actionParts.reduce((name, part) => {
      name += (part === PolicyTranslator.ANY ? part : Inflector.pascalCase(part));

      return name;
    }, '');

    lambdaFunctionName = lambdaFunctionName.replace(/\*+/g, '*');

    return lambdaService.generateAwsResourceName(
      lambdaFunctionName,
      Core.AWS.Service.LAMBDA,
      microserviceIdentifier
    );
  }

  /**
   * @param {String[]} parts
   * @returns {Boolean}
   * @private
   */
  _actionsExists(parts) {
    let microservices = this._backendConfig.microservices;

    return microservices.hasOwnProperty(parts[0]) &&
      (
        parts[1] === PolicyTranslator.ANY ||
        microservices[parts[0]].resources.hasOwnProperty(parts[1])
      ) &&
      (
        parts[2] === PolicyTranslator.ANY ||
        microservices[parts[0]].resources[parts[1]].hasOwnProperty(parts[2])
      );
  }

  /**
   * @returns {String}
   */
  static get ANY() {
    return '*';
  }
}
