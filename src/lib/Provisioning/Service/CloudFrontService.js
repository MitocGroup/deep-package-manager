/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {S3Service} from './S3Service';
import {Hash} from '../../Helpers/Hash';
import {FailedToCreateCloudFrontDistributionException} from './Exception/FailedToCreateCloudFrontDistributionException';

/**
 * CloudFront service
 */
export class CloudFrontService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
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
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _setup(services) {
    this._config = {};

    this._ready = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postProvision(services) {
    this._createDistribution(services, function(cfData) {
      this._config.id = cfData.Distribution.Id;
      this._config.domain = cfData.Distribution.DomainName;

      this._readyTeardown = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _createDistribution(services, cb) {
    let cf = this.provisioning.cloudFront;

    let idPrefix = `${this.awsAccountId}-${this.env}-`;

    let bucketName = services.find(S3Service).config().buckets[S3Service.PUBLIC_BUCKET].name;
    let environmentPath = `${idPrefix}${Hash.crc32(this.appIdentifier)}${Hash.crc32(bucketName)}`;
    let originId = `${bucketName}.s3.amazonaws.com`;

    let payload = {
      DistributionConfig: {
        CallerReference: environmentPath,
        Comment: environmentPath,
        DefaultCacheBehavior: {
          ForwardedValues: {
            Cookies: {
              Forward: 'all',
            },
            QueryString: true,
          },
          MinTTL: 0,
          MaxTTL: 31536000,
          DefaultTTL: 86400,
          TargetOriginId: originId,
          TrustedSigners: {
            Enabled: false,
            Quantity: 0,
          },
          ViewerProtocolPolicy: 'allow-all',
        },
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: originId,
              DomainName: originId,
              OriginPath: '',
              S3OriginConfig: {
                OriginAccessIdentity: '',
              },
            },
          ],
        },
        DefaultRootObject: 'index.html',
        ViewerCertificate: {
          CloudFrontDefaultCertificate: true,
          MinimumProtocolVersion: 'SSLv3',
        },
        CustomErrorResponses: {
          Items: [
            {
              ErrorCode: 404,
              ResponsePagePath: '/index.html',
              ResponseCode: '200',
              ErrorCachingMinTTL: 300,
            },
          ],
          Quantity: 1,
        },
      },
    };

    cf.createDistribution(payload, function(error, data) {
      if (error) {
        throw new FailedToCreateCloudFrontDistributionException(error);
      }

      cb(data);
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postDeployProvision(services) {
    this._ready = true;

    return this;
  }
}
