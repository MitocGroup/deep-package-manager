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
   * @param {String} lambdaArn
   * @param {String} distributionId
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
      let payload = {
        Id: distributionId,
        IfMatch: response.ETag,
        DistributionConfig: distributionConfig,
      };

      functionAssociations.Items = functionAssociations.Items || [];

      for (let item of functionAssociations.Items) {
        if (item.EventType === eventType) {
          if (item.LambdaFunctionARN === lambdaArn) { // looks like it's already attached
            // do not return Promise.resolve()
            // functionAssociations are not reliable
            return this._cloudFrontClient.updateDistribution(payload).promise();
          }

          throw new CloudFrontEventAlreadyExistsException(eventType, distributionId, item.LambdaFunctionARN);
        }
      }

      functionAssociations.Quantity += 1;
      functionAssociations.Items.push({
        EventType: eventType,
        LambdaFunctionARN: lambdaArn,
      });

      return this._cloudFrontClient.updateDistribution(payload).promise();
    });
  }

  /**
   * @param {String[]} events
   * @param {String} distributionId
   * @returns {Promise.<TResult>}
   */
  detachEventsFromDistribution(events, distributionId) {
    return this._cloudFrontClient.getDistributionConfig({
      Id: distributionId,
    }).promise().then(response => {
      let distributionConfig = response.DistributionConfig;
      let functionAssociations = distributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations;
      let payload = {
        Id: distributionId,
        IfMatch: response.ETag,
        DistributionConfig: distributionConfig,
      };

      let newFunctionAssociations = {
        Quantity: 0,
        Items: [],
      };

      functionAssociations.Items.forEach(item => {
        if (events.indexOf(item.EventType) === -1) {
          newFunctionAssociations.Items.push(item);
          newFunctionAssociations.Quantity += 1;
        }
      });

      distributionConfig.DefaultCacheBehavior.LambdaFunctionAssociations = newFunctionAssociations;

      return this._cloudFrontClient.updateDistribution(payload).promise();
    });
  }

  /**
   * @param {String} distributionId
   * @returns {Promise}
   */
  getDistributionCNAMES(distributionId) {
    return this._cloudFrontClient.getDistributionConfig({
      Id: distributionId,
    }).promise().then(response => {
      let cnamesObj = response.DistributionConfig.Aliases;

      return cnamesObj.Items || [];
    });
  }
}
