/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {AbstractDriver as AbstractTaggingDriver} from '../ResourceTagging/Driver/AbstractDriver';
import {AbstractService} from '../Service/AbstractService';

export class CloudFrontDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._listDistributions(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextMarker
   * @private
   */
  _listDistributions(cb, nextMarker = null) {
    let payload = {
      MaxItems: CloudFrontDriver.MAX_ITEMS,
    };

    if (nextMarker) {
      payload.Marker = nextMarker;
    }

    this._awsService.listDistributions(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      let distCount = data.DistributionList.Items.length;

      for (let i in data.DistributionList.Items) {
        if (!data.DistributionList.Items.hasOwnProperty(i)) {
          continue;
        }

        let distribution = data.DistributionList.Items[i];

        setTimeout(() => {
          this._checkDistributionTags(distribution)
            .catch(e => {
              console.warn(`Error checking distribution "${distribution.Id}" tags: ${e}`);
            })
            .then(() => {
              distCount--;

              if (distCount === 0) {
                if (data.DistributionList.IsTruncated) {
                  let marker = data.DistributionList.NextMarker;

                  this._listDistributions(cb, marker);
                } else {
                  cb(null);
                }
              }
            });
        }, i * CloudFrontDriver.REQUEST_INTERVAL);
      }
    });
  }

  /**
   * @param {Object} distribution
   * @returns {Promise}
   * @private
   */
  _checkDistributionTags(distribution) {
    let envNameKey = AbstractTaggingDriver.ENVIRONMENT_NAME_KEY;
    let envIdKey = AbstractTaggingDriver.ENVIRONMENT_ID_KEY;
    let awsResourcePrefix = AbstractService.AWS_RESOURCES_PREFIX;

    return this._retryableRequest(this._awsService.listTagsForResource({
      Resource: distribution.ARN,
    })).promise().then(response => {
      let tags = response.Tags.Items.reduce((obj, tag) => {
        obj[tag.Key] = tag.Value;

        return obj;
      }, {});

      if (tags.hasOwnProperty(envNameKey) && tags.hasOwnProperty(envIdKey)) {
        let cfResourceId = `${awsResourcePrefix}.${tags[envNameKey]}.cloudfront.${tags[envIdKey]}`;

        distribution.DeepResourceId = cfResourceId;

        this._checkPushStack(cfResourceId, distribution.Id, distribution);
      }
    });
  }

  /**
   * @returns {String}
   */
  static get MAX_ITEMS() {
    return '100';
  }

  /**
   * @returns {String}
   */
  static get REQUEST_INTERVAL() {
    return '500';
  }
}
