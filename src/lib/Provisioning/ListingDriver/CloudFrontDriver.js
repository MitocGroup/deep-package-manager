/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import Core from 'deep-core';
import {AbstractTaggingDriver} from './AbstractTaggingDriver';
import {CloudFrontService} from '../Service/CloudFrontService';

export class CloudFrontDriver extends AbstractTaggingDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  region() {
    // used this region to avoid "Invocation of TagResources for this resource is not supported in this region"
    return Core.AWS.Region.US_EAST_VIRGINIA;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return CloudFrontService.AVAILABLE_REGIONS;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    Promise.all([
      this.listFilteredResources(),
      this._listDistributions(),
    ]).then(responses => {
      let resourcesToPush = responses[0];
      let distributions = responses[1];
      let resourcesToPushMap = resourcesToPush.reduce((map, resource) => {
        map[resource.ResourceARN] = resource.Tags;

        return map;
      }, {});

      let arnsToPush = Object.keys(resourcesToPushMap);

      distributions.forEach(distribution => {
        if (arnsToPush.indexOf(distribution.ARN) !== -1) {
          // @todo: refactor deepify list to extract resource id directly from tags
          distribution.DeepResourceId = this._generateResourceIdFromTags(resourcesToPushMap[distribution.ARN]);

          this._checkPushStack(distribution.DeepResourceId, distribution.Id, distribution);
        }
      });
    }).catch(e => {
      console.warn('Error while listing cloudfront distributions: ', e.stack);
    }).then(() => {
      // avoid callback synchronous errors
      setImmediate(() => {
        cb();
      });
    })
  }

  /**
   * @returns {String}
   */
  resourceType() {
    return 'cloudfront:distribution';
  }

  /**
   * @param {String|null} nextMarker
   * @returns {Promise}
   * @private
   */
  _listDistributions(nextMarker = null) {
    let payload = {
      MaxItems: CloudFrontDriver.MAX_ITEMS,
    };

    if (nextMarker) {
      payload.Marker = nextMarker;
    }

    return this._awsService.listDistributions(payload).promise().then(data => {
      let distributions = data.DistributionList.Items || [];

      if (data.DistributionList.IsTruncated) {
        let marker = data.DistributionList.NextMarker;

        return this._listDistributions(marker).then(childDistributions => {
          return distributions.concat(childDistributions);
        });
      } else {
        return distributions;
      }
    });
  }

  /**
   * @returns {String}
   */
  static get MAX_ITEMS() {
    return '100';
  }
}
