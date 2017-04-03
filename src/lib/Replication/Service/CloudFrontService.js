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

    return this._getDistributionConfig({
      Id: distributionId,
    }).then(response => {
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

      return this._updateDistribution(payload);
    });
  }

  /**
   * @param {String[]} events
   * @param {String} distributionId
   * @returns {Promise}
   */
  detachEventsFromDistribution(events, distributionId) {
    return this._getDistributionConfig({
      Id: distributionId,
    }).then(response => {
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

      return this._updateDistribution(payload);
    });
  }

  /**
   * @param {String} bDistributionId
   * @param {String} gDistributionId
   * @returns {Promise}
   */
  hotSwapCloudFrontCNames(bDistributionId = null, gDistributionId = null) {
    bDistributionId = bDistributionId || this.blueConfig().id;
    gDistributionId = gDistributionId || this.greenConfig().id;

    return Promise.all([
      this._getDistributionConfig({Id: bDistributionId}),
      this._getDistributionConfig({Id: gDistributionId}),
    ]).then(responses => {
      let bDistributionConfig = responses[0].DistributionConfig;
      let gDistributionConfig = responses[1].DistributionConfig;

      let tmpAliases = bDistributionConfig.Aliases;
      bDistributionConfig.Aliases = gDistributionConfig.Aliases;
      gDistributionConfig.Aliases = tmpAliases;

      let bPayload = {
        Id: bDistributionId,
        IfMatch: responses[0].ETag,
        DistributionConfig: bDistributionConfig,
      };

      let gPayload = {
        Id: gDistributionId,
        IfMatch: responses[1].ETag,
        DistributionConfig: gDistributionConfig,
      };

      return Promise.all([
        this._updateDistribution(this._resetCfAliases(bPayload)),
        this._updateDistribution(this._resetCfAliases(gPayload)),
      ]).then(() => Promise.all([
        this._refreshDistributionObjETag(bPayload),
        this._refreshDistributionObjETag(gPayload),
      ]))
      .then(() => Promise.all([
        this._updateDistribution(bPayload),
        this._updateDistribution(gPayload),
      ]));
    });
  }

  /**
   * @param {Object} distributionObj
   * @returns {Promise}
   * @private
   */
  _refreshDistributionObjETag(distributionObj) {
    return this._getDistributionConfig({
      Id: distributionObj.Id,
    }).then(response => {
      distributionObj.IfMatch = response.ETag;

      return distributionObj;
    });
  }

  /**
   * @param {Object} distributionObj
   *
   * @returns {Object}
   * @private
   */
  _resetCfAliases(distributionObj) {
    let clone = JSON.parse(JSON.stringify(distributionObj));

    clone.DistributionConfig.Aliases = {
      Items: [],
      Quantity: 0,
    };

    return clone;
  }

  /**
   * @param {String} distributionId
   * @returns {Promise}
   */
  getDistributionCNAMES(distributionId) {
    return this._getDistributionConfig({
      Id: distributionId,
    }).then(response => {
      let cnamesObj = response.DistributionConfig.Aliases;

      return cnamesObj.Items || [];
    });
  }

  /**
   * @param {Object} payload
   * @returns {Promise}
   * @private
   */
  _getDistributionConfig(payload) {
    return this._retryableRequest(
      this._cloudFrontClient.getDistributionConfig(payload)
    ).promise();
  }

  /**
   * @param {Object} updatePayload
   * @returns {Promise}
   * @private
   */
  _updateDistribution(updatePayload) {
    return this._retryableRequest(
      this._cloudFrontClient.updateDistribution(updatePayload)
    ).promise();
  }
}
