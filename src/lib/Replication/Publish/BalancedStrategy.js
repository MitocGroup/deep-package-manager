/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import {CloudFrontEvent} from '../Service/Helpers/CloudFrontEvent';
import {AbstractStrategy} from './AbstractStrategy';

export class BalancedStrategy extends AbstractStrategy {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Number} percentage
   *
   * @returns {Promise}
   */
  publish(percentage) {
    let cloudFrontService = this.replication.cloudFrontService;
    let lambdaService = this.replication.lambdaService;

    let cfDistributionId = cloudFrontService.blueConfig().id;
    let greenDistributionId = cloudFrontService.greenConfig().id;

    return cloudFrontService.getDistributionCNAMES(greenDistributionId).then(cNames => {
      let lambdaVariables = this.replication.buildLambdaEdgeVariables(percentage, cNames);

      return this._prepareCloudFrontLambda(
        lambdaService.cloudFrontTrafficManagerFunctionName,
        lambdaVariables,
        cfDistributionId,
        CloudFrontEvent.VIEWER_REQUEST
      ).then(() => {
        return this._prepareCloudFrontLambda(
          lambdaService.cloudFrontResponseEnhancerFunctionName,
          lambdaVariables,
          cfDistributionId,
          CloudFrontEvent.VIEWER_RESPONSE
        );
      });
    });
  }

  /**
   * @param {String} functionName
   * @param {Object} variables
   * @param {String} cfDistributionId
   * @param {String} eventType
   * @returns {Promise}
   * @private
   */
  _prepareCloudFrontLambda(functionName, variables, cfDistributionId, eventType) {
    let cloudFrontService = this.replication.cloudFrontService;
    let lambdaService = this.replication.lambdaService;

    return lambdaService.compileLambdaForCloudFront(functionName, variables)
      .then(() => lambdaService.addLambdaEdgeInvokePermission(functionName, cfDistributionId))
      .then(() => {
        console.info(`Attaching "${functionName}" to ${cfDistributionId} ${eventType} event.`);

        return cloudFrontService.attachLambdaToDistributionEvent(
          lambdaService.generateLambdaArn(functionName),
          cfDistributionId,
          eventType
        );
      })
      .then(() => {
        console.info(`Function "${functionName} has been attached to ${cfDistributionId} ${eventType} event.`);
      });
  }
}
