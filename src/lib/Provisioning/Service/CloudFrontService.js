/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {S3Service} from './S3Service';
import {ACMService} from './ACMService';
import {FailedToCreateCloudFrontDistributionException}
  from './Exception/FailedToCreateCloudFrontDistributionException';
import {WaitFor} from '../../Helpers/WaitFor';
import objectMerge from 'object-merge';
import {UrlReplacer} from '../../Assets/Replacer/UrlReplacer';

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
      ViewerProtocolPolicy: 'redirect-to-https',
      ViewerCertificate: {
        CloudFrontDefaultCertificate: true,
        CertificateSource: 'cloudfront',
      },
      Aliases: {
        Quantity: 0,
        Items: [],
      },
    };

    this._isDistributionCreated = false;
  }

  /**
   *
   * @returns {Boolean}
   */
  get isDistributionCreated() {
    return this._isDistributionCreated;
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
        this._isDistributionCreated = true;

        this._readyTeardown = true;
      });
    });

    return this;
  }

  /**
   * @param {Object} configChanges
   * @param {Function} cb
   */
  updateDistribution(configChanges, cb) {
    this.fetchDistributionConfig((error, data) => {
      if (error) {
        cb(error, null);
        return;
      }

      let cf = this.provisioning.cloudFront;

      let eTag = data.ETag;
      let config = objectMerge(data.DistributionConfig, configChanges);

      let payload = {
        DistributionConfig: config,
        Id: this._config.id, // This is validated in fetchDistributionConfig()
        IfMatch: eTag,
      };

      cf.updateDistribution(payload, cb);
    });
  }

  /**
   * @param {Function} cb
   */
  fetchDistributionConfig(cb) {
    let cf = this.provisioning.cloudFront;
    let cfId = this._config.id;

    if (!cfId) {
      cb(new Error('No CloudFront distribution provisioned'), null);
      return;
    }

    let payload = {
      Id: cfId,
    };

    cf.getDistributionConfig(payload, (error, data) => {
      if (error) {
        cb(error, null);
        return;
      }

      cb(null, data);
    });
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @param {Function} cb
   * @returns {CloudFrontService}
   */
  _createDistribution(services, cb) {
    let cf = this.provisioning.cloudFront;

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
            QueryStringCacheKeys: {
              Quantity: 1,
              Items: [ UrlReplacer.VERSION_PARAM ],
            },
          },
          MinTTL: 60, // one minute
          MaxTTL: 604800, // one week
          DefaultTTL: 86400, // one day
          TargetOriginId: bucketWebsite,
          TrustedSigners: {
            Enabled: false,
            Quantity: 0,
          },
          ViewerProtocolPolicy: this._distMetadata.ViewerProtocolPolicy,
          Compress: true,
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
        Aliases: this._distMetadata.Aliases,
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
