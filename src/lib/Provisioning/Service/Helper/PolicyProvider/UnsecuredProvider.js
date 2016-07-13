/**
 * Created by CCristi on 7/7/16.
 */

'use strict';

import {AbstractProvider} from './AbstractProvider';
import Core from 'deep-core';

export class UnsecuredProvider extends AbstractProvider {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   */
  _getAuthenticatedPolicy() {
    return this._generateAllowLambdaServicePolicy();
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   */
  _getUnauthenticatedPolicy() {
    return this._generateAllowLambdaServicePolicy();
  }

  /**
   * @returns {Core.AWS.IAM.Policy}
   * @private
   */
  _generateAllowLambdaServicePolicy() {
    let policy = new Core.AWS.IAM.Policy();
    let lambdaService = this.lambdaService;
    let denyLambdaStatement;

    policy.statement.add(lambdaService.generateAllowActionsStatement());

    if (denyLambdaStatement = lambdaService.generateDenyInvokeFunctionStatement()) {
      policy.statement.add(denyLambdaStatement);
    }
    
    return policy;
  }
}
