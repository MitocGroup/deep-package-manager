/**
 * Created by CCristi on 4/19/17.
 */

'use strict';

import Core from 'deep-core';
import {AbstractDriver} from './AbstractDriver';
import {LambdaService} from '../../Service/LambdaService';
import {Tagging} from '../Tagging';

export class LambdaDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.LAMBDA;
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.lambda.config.region;
  }

  /**
   * @returns {String[]}
   */
  resourcesArns() {
    let lambdaArns = [];
    let lambdaService = this.provisioning.services.find(LambdaService);
    let lambdasObj = lambdaService.config().names;

    for (let msName in lambdasObj) {
      if (!lambdasObj.hasOwnProperty(msName)) {
        continue;
      }

      for (let actionName in lambdasObj[msName]) {
        if (!lambdasObj[msName].hasOwnProperty(actionName)) {
          continue;
        }

        let lambdaArn = lambdaService._generateLambdaArn(lambdasObj[msName][actionName]);

        lambdaArns.push(lambdaArn);
      }
    }

    return lambdaArns;
  }

  /**
   * @returns {Number}
   */
  step() {
    return Tagging.POST_DEPLOY_STEP;
  }
}
