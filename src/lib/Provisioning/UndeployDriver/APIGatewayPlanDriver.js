/**
 * Created by mgoria on 02/02/17.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class APIGatewayPlanDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'APIGatewayPlan';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removePlanAssociatedStages(resourceData.apiStages)
      .then(data => {
        this._awsService.deleteUsagePlan({usagePlanId: resourceId}, (error) => {
          cb(error);
        });
      })
      .catch(cb);
  }

  /**
   * @param {Object[]|null} apiStages
   * @returns {Promise}
   * @private
   */
  _removePlanAssociatedStages(apiStages) {
    let deleteStagePromises = [];

    if (apiStages && apiStages.length > 0) {
      apiStages.forEach(apiStage => {
        deleteStagePromises.push(
          this._awsService.deleteStage({
            restApiId: apiStage.apiId,
            stageName: apiStage.stage
          }).promise().catch(error => {
            console.error(`Error deleting "${apiStage.stage}" stage from "${apiStage.apiId}" api gateway. ${error}`);
          })
        );
      });
    }

    return Promise.all(deleteStagePromises);
  }
}
