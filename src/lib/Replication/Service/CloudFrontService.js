/**
 * Created by CCristi on 3/6/17.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {CloudFrontEvent} from './Helpers/CloudFrontEvent';
import {MissingCloudFrontEventTypeException} from '../Exception/MissingCloudFrontEventTypeException';
import Core from 'deep-core';
import {CloudFrontEventAlreadyExistsException} from '../Exception/CloudFrontEventAlreadyExistsException';

export class CloudFrontService extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._cloudFrontClient = null;
  }

  /**
   * @returns {*}
   */
  name() {
    return Core.AWS.Service.CLOUD_FRONT;
  }

  /**
   * @param {AWS.CloudFront|Object} cloudFrontClient
   */
  set cloudFrontClient(cloudFrontClient) {
    this._cloudFrontClient = cloudFrontClient;
  }

  /**
   * @param {String} distributionId
   * @param {String} lambdaArn
   * @param {String} eventType
   * @returns {Promise}
   */
  attachLambdaToDistributionEvent(lambdaArn, distributionId, eventType) {
    if (!CloudFrontEvent.exists(eventType)) {
      return Promise.reject(new MissingCloudFrontEventTypeException(eventType));
    }

    return this._cloudFrontClient.getDistributionConfig({
        Id: distributionId,
      }).promise().then(response => {
      let distributionConfig = response.DistributionConfig;
      let functionAssociations = distributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations;

      functionAssociations.Items = functionAssociations.Items || [];
      functionAssociations.Quantity += 1;

      for (let item of functionAssociations.Items) {
        if (item.EventType === eventType) {
          if (item.LambdaFunctionARN === lambdaArn) { // looks like it's already attached
            return Promise.resolve();
          }

          throw new CloudFrontEventAlreadyExistsException(eventType, distributionId, item.LambdaFunctionARN);
        }
      }

      functionAssociations.Items.push({
        EventType: eventType,
        LambdaFunctionARN: lambdaArn,
      });

      return this._cloudFrontClient.updateDistribution({
        Id: distributionId,
        IfMatch: response.ETag,
        DistributionConfig: distributionConfig,
      }).promise();
    });
  }
}
