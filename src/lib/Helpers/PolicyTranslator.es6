/**
 * Created by mgoria on 5/27/16.
 */

'use strict';

import {AbstractService} from '../Provisioning/Service/AbstractService';
import {Inflector} from './Inflector';
import {Exception} from '../Exception/Exception';
import Core from 'deep-core';

export class PolicyTranslator {
  /**
   * @param {Object} appConfig
   */
  constructor(appConfig) {
    this._appConfig = appConfig;
  }

  /**
   * @param {String} apiGatewayBase
   *
   * @returns {String}
   */
  extractApiGatewayId(apiGatewayBase) {
    let matches = apiGatewayBase.match(
      /^https?:\/\/([^.]+)\.execute-api\.[^.]+\.amazonaws\.com\/(.+)$/i
    );
    
    if (matches.length !== 3) {
      return { id: '*', stage: '*' };
    }
    
    return { id: matches[1], stage: matches[2] };
  }
  
  /**
   * @returns {String}
   */
  getApiData() {
    let apiGatewayBase = this._appConfig.website 
      ? this._appConfig.website.apigateway
      : this._appConfig.provisioning.apigateway.api.baseUrl;
    
    return this.extractApiGatewayId(apiGatewayBase);
  }

  /**
   * @param {Object} policy
   * @returns {Core.AWS.IAM.Policy}
   */
  toIAMPolicy(policy) {
    let iamPolicy = new Core.AWS.IAM.Policy();
    let apiData = this.getApiData();

    policy.Statement.forEach(rawDeepStmt => {
      let lambdaStmt = iamPolicy.statement.add();
      let apiStmt = iamPolicy.statement.add();

      lambdaStmt.effect = rawDeepStmt.Effect;
      apiStmt.effect = rawDeepStmt.Effect;
      lambdaStmt.action.add(Core.AWS.Service.LAMBDA, 'InvokeFunction');
      apiStmt.action.add(Core.AWS.Service.API_GATEWAY_EXECUTE, 'Invoke');

      rawDeepStmt.Action.map(this._resolveDeepAction.bind(this))
        .forEach(functionName => {
          lambdaStmt.resource.add(
            Core.AWS.Service.LAMBDA,
            this._appConfig.awsRegion,
            this._appConfig.awsAccountId,
            `function:${functionName}`
          );
        });

      rawDeepStmt.Action.map(this._resolveDeepActionEndpoints.bind(this))
        .forEach(endpointName => {
          apiStmt.resource.add(
            Core.AWS.Service.API_GATEWAY_EXECUTE,
            this._appConfig.awsRegion,
            this._appConfig.awsAccountId,
            [apiData.id, apiData.stage, endpointName].join('/')
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
  _resolveDeepActionEndpoints(action) {
    if (typeof action != 'string') {
      throw new TypeError(`Invalid action parameter type. Expected string got ${typeof action}`);
    }

    if (action === PolicyTranslator.ANY) {
      return this.generateAwsResourceName('*');
    }

    let actionParts = action.split(':');

    actionParts[1] = actionParts[1] || PolicyTranslator.ANY;
    actionParts[2] = actionParts[2] || PolicyTranslator.ANY;

    if (!this._actionsExists(actionParts)) {
      throw new Exception(`'${action}' deep action doesn't exists`);
    }

    return actionParts.reduce((name, part) => {
      
      // API Gateway does not support dots into resource name / path
      name += '/' + (part === PolicyTranslator.ANY ? part : part.replace(/\./g, '-'));

      return name;
    }, '*');
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

    if (action === PolicyTranslator.ANY) {
      return this.generateAwsResourceName('*');
    }

    let actionParts = action.split(':');

    actionParts[1] = actionParts[1] || PolicyTranslator.ANY;
    actionParts[2] = actionParts[2] || PolicyTranslator.ANY;

    if (!this._actionsExists(actionParts)) {
      throw new Exception(`'${action}' deep action doesn't exists`);
    }

    let microserviceIdentifier = actionParts.shift();
    let lambdaFunctionName = actionParts.reduce((name, part) => {
      name += (part === PolicyTranslator.ANY ? part : Inflector.pascalCase(part));

      return name;
    }, '');

    lambdaFunctionName = lambdaFunctionName.replace(/\*+/g, '*');

    return this.generateAwsResourceName(
      lambdaFunctionName,
      microserviceIdentifier
    );
  }

  /**
   * @param {String[]} parts
   * @returns {Boolean}
   * @private
   */
  _actionsExists(parts) {
    let microservices = this._appConfig.microservices;
    let microservice = parts[0];
    let resource = parts[1];
    let action = parts[2];

    return microservices.hasOwnProperty(microservice) &&
      (
        resource === PolicyTranslator.ANY ||
        microservices[microservice].resources.hasOwnProperty(resource)
      ) &&
      (
        action === PolicyTranslator.ANY ||
        microservices[microservice].resources[resource].hasOwnProperty(action)
      );
  }
  
  /**
   * @returns {String}
   */
  getAppHash() {
    return AbstractService.generateUniqueResourceHash(
      this._appConfig.awsAccountId, 
      this._appConfig.appIdentifier
    );
  }

  /**
   * @param {String} resourceName
   * @param {String} msIdentifier
   * @returns {String}
   */
  generateAwsResourceName(resourceName, msIdentifier = '') {
    return AbstractService.generateAwsResourceName(
      resourceName,
      Core.AWS.Service.LAMBDA,
      this._appConfig.awsAccountId,
      this._appConfig.appIdentifier,
      this._appConfig.env,
      msIdentifier
    );
  }

  /**
   * @returns {String}
   */
  static get ANY() {
    return '*';
  }
}
