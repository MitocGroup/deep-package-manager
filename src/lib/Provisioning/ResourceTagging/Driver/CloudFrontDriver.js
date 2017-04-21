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
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.cloudFront.config.region;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.CLOUD_FRONT;
  }

  /**
   * @returns {String[]}
   */
  resourcesArns() {
    let distributionId = this.provisioning.config[Core.AWS.Service.CLOUD_FRONT].id;

    return [
      this.generateCloudFrontARN(distributionId),
    ];
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
