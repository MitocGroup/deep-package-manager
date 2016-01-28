/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {S3Service} from './S3Service';
import {ACMService} from './ACMService';
import {FailedToCreateCloudFrontDistributionException} from './Exception/FailedToCreateCloudFrontDistributionException';
import {FailedToRequestCloudFrontDistributionCertificateException} from './Exception/FailedToRequestCloudFrontDistributionCertificateException';
import {Hash} from '../../Helpers/Hash';
import {WaitFor} from '../../Helpers/WaitFor';

/**
 * CloudFront service
 */
export class CloudFrontService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._distMetadata = {
      ViewerProtocolPolicy: 'allow-all',
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true,
        CertificateSource: 'cloudfront',
      },
    };
  }

  /**
   * @returns {{ViewerProtocolPolicy: string, ViewerCertificate: {CloudFrontDefaultCertificate: boolean, MinimumProtocolVersion: string}}|*}
   */
  get distMetadata() {
    return this._distMetadata;
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
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    let acmService = services.find(ACMService);
    let wait = new WaitFor();

    wait.push(() => {
      return acmService.allowRunCf;
    });

    wait.ready(() => {
      this._createDistribution(services, (cfData) => {
        this._config.id = cfData.Distribution.Id;
        this._config.domain = cfData.Distribution.DomainName;

        this._readyTeardown = true;
      });
    });

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @param {Function} cb
   * @returns {CloudFrontService}
   */
  _createDistribution(services, cb) {
    let cf = this.provisioning.cloudFront;

    let idPrefix = `${this.awsAccountId}-${this.env}-`;

    let bucketConfig = services.find(S3Service).config().buckets[S3Service.PUBLIC_BUCKET];
    let bucketWebsite = bucketConfig.website;
    let bucketName = bucketConfig.name;

    let payload = {
      DistributionConfig: {
        CallerReference: bucketWebsite,
        Comment: bucketName,
        DefaultCacheBehavior: {
          ForwardedValues: {
            Cookies: {
              Forward: 'all',
            },
            QueryString: true,
          },

          // @todo: fine tune cache behavior
          MinTTL: 0,
          MaxTTL: 60,// 31536000,
          DefaultTTL: 60,// 86400,

          TargetOriginId: bucketWebsite,
          TrustedSigners: {
            Enabled: false,
            Quantity: 0,
          },
          ViewerProtocolPolicy: this._distMetadata.ViewerProtocolPolicy,
        },
        Enabled: true,
        Origins: {
          Quantity: 1,
          Items: [
            {
              Id: bucketWebsite,
              DomainName: bucketWebsite,
              OriginPath: '',
              CustomOriginConfig: {
                HTTPPort: 80,
                HTTPSPort: 443, // useless in our case
                OriginProtocolPolicy: 'http-only',
              },
            },
          ],
        },
        DefaultRootObject: 'index.html',
        ViewerCertificate: this._distMetadata.ViewerCertificate,
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

    cf.createDistribution(payload, (error, data) => {
      if (error) {
        throw new FailedToCreateCloudFrontDistributionException(error);
      }

      cb(data);
    });

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {CloudFrontService}
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }
}
