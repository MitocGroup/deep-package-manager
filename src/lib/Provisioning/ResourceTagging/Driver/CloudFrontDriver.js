/**
 * Created by CCristi on 8/11/16.
 */

'use strict';

import Core from 'deep-core';
import {AbstractDriver} from './AbstractDriver';
import {CloudFrontService} from '../../Service/CloudFrontService';

export class CloudFrontDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
    
    this._cloudFront = this.provisioning.cloudFront;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let distributionId = this.provisioning.config[Core.AWS.Service.CLOUD_FRONT].id;
    let payload = {
      Resource: this.generateCloudFrontARN(distributionId),
      Tags: {
        Items: this.tagsPayload,
      },
    };

    this._cloudFront.tagResource(payload, error => {
      if (error) {
        console.warn(`Error on tagging cloudfront distribution ${distributionId}: ${error}`);
      } else {
        console.debug(`Cloudfront distribution ${distributionId} has been successfully tagged`);
      }

      cb();
    });
  }

  /**
   * @param {String} distributionId
   * @returns {String}
   */
  generateCloudFrontARN(distributionId) {
    let cloudFrontService = this.provisioning.services.find(CloudFrontService);
    let awsAccountId = cloudFrontService.awsAccountId;

    return `arn:aws:cloudfront::${awsAccountId}:distribution/${distributionId}`;
  }
}
