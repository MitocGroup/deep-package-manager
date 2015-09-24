/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {FailedToCreateBucketException} from './Exception/FailedToCreateBucketException';
import {FailedAttachingPolicyToBucketException} from './Exception/FailedAttachingPolicyToBucketException';
import {FailedSettingBucketAsWebsiteException} from './Exception/FailedSettingBucketAsWebsiteException';
import {FailedAddingLifecycleException} from './Exception/FailedAddingLifecycleException';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {Hash} from '../../Helpers/Hash';

/**
 * S3 service
 */
export class S3Service extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  static get TMP_BUCKET() {
    return 'temp'; // @note - do not change this prefix, it is also used in deep-fs component
  }

  /**
   * @returns {String}
   */
  static get PUBLIC_BUCKET() {
    return 'public'; // @note - do not change this prefix, it is also used in deep-fs component
  }

  /**
   * @returns {String}
   */
  static get SYSTEM_BUCKET() {
    return 'system'; // @note - do not change this prefix, it is also used in deep-fs component
  }

  /**
   * @returns {String[]}
   */
  static get FS_BUCKETS_SUFFIX() {
    return [
      S3Service.TMP_BUCKET,
      S3Service.PUBLIC_BUCKET,
      S3Service.SYSTEM_BUCKET,
    ];
  }

  /**
   * @param {String} appIdentifier
   * @returns {Object}
   */
  static fakeBucketsConfig(appIdentifier) {
    let config = {};
    let propertyHash = Hash.md5(appIdentifier.toString());

    config[S3Service.TMP_BUCKET] = {
      name: `${propertyHash}-${S3Service.TMP_BUCKET}`,
    };

    config[S3Service.PUBLIC_BUCKET] = {
      name: `${propertyHash}-${S3Service.PUBLIC_BUCKET}`,
    };

    config[S3Service.SYSTEM_BUCKET] = {
      name: `${propertyHash}-${S3Service.SYSTEM_BUCKET}`,
    };

    return config;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
  }

  /**
   * @returns {string[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {S3Service}
   */
  _setup(services) {
    this._createFsBuckets(
      S3Service.FS_BUCKETS_SUFFIX
    )(function(buckets) {
      this._config = {
        buckets: buckets,
      };
      this._ready = true;
    }.bind(this));

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {S3Service}
   */
  _postProvision(services) {
    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {S3Service}
   */
  _postDeployProvision(services) {
    this._ready = true;

    return this;
  }

  /**
   * @param {String[]} bucketsSuffix
   * @returns {Function}
   * @private
   */
  _createFsBuckets(bucketsSuffix) {
    var buckets = {};
    let s3 = this.provisioning.s3;
    let syncStack = new AwsRequestSyncStack();
    let tmpBucket = null;

    for (let bucketSuffix of bucketsSuffix) {
      let bucketName = this.generateAwsResourceName(
        bucketSuffix,
        Core.AWS.Service.SIMPLE_STORAGE_SERVICE,
        '',
        AbstractService.DELIMITER_DOT
      );

      syncStack.push(s3.createBucket({Bucket: bucketName}), function(error, data) {
        if (error) {
          throw new FailedToCreateBucketException(bucketName, error);
        }

        let accessPolicy = S3Service.getBucketPolicy(bucketName);
        let params = {
          Bucket: bucketName,
          Policy: accessPolicy.toString(),
        };

        buckets[bucketSuffix] = {};

        syncStack.level(1).push(s3.putBucketPolicy(params), function(error, data) {
          if (error) {
            throw new FailedAttachingPolicyToBucketException(bucketName, error);
          }

          buckets[bucketSuffix].name = bucketName;
        }.bind(this));

        // setup public bucket as static website hosting
        if (S3Service.isBucketPublic(bucketName)) {
          let websiteConfig = S3Service.getStaticWebsiteConfig(bucketName);

          syncStack.level(1).push(s3.putBucketWebsite(websiteConfig), function(error, data) {
            if (error) {
              throw new FailedSettingBucketAsWebsiteException(bucketName, error);
            }

            // @todo - create website base url from bucketName + region etc
            //buckets[bucketSuffix].website = data;
          }.bind(this));
        } else if (S3Service.isBucketTmp(bucketName)) {
          tmpBucket = bucketName;
        }
      }.bind(this));
    }

    return function(callback) {
      return syncStack.join().ready(function() {
        let lifecyclePayload = {
          Bucket: tmpBucket,
          LifecycleConfiguration: {
            Rules: [
              {
                Prefix: '',
                Status: 'Enabled',
                Expiration: {
                  Days: S3Service.TMP_DAYS_LIFECYCLE,
                },
              },
            ],
          },
        };

        s3.putBucketLifecycle(lifecyclePayload, function(error, data) {
          if (error) {
            throw new FailedAddingLifecycleException(tmpBucket, error);
          }

          callback(buckets);
        }.bind(this));
      }.bind(this));
    }.bind(this);
  }

  /**
   * @param {String} bucketName
   * @returns {Core.AWS.IAM.Policy}
   * @private
   */
  static getBucketPolicy(bucketName) {
    let policy = new Core.AWS.IAM.Policy();

    // allow lambda service to have full access to buckets
    policy.statement.add(
      S3Service.getCommonPolicyStatement(bucketName)
    );

    // allow everyone to execute s3:GetObject method on public bucket
    if (S3Service.isBucketPublic(bucketName)) {
      policy.statement.add(
        S3Service.getPublicPolicyStatement(bucketName)
      );
    }

    return policy;
  }

  /**
   * Statement that allows only Lambda service to have full access to passed bucket
   *
   * @param {String} bucketName
   * @returns {Statement}
   * @private
   */
  static getCommonPolicyStatement(bucketName) {
    let statement = Core.AWS.IAM.Factory.create('statement');

    statement.principal = {
      Service: Core.AWS.Service.identifier(Core.AWS.Service.LAMBDA),
    };

    let action = statement.action.add();
    action.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;

    let resource1 = statement.resource.add();
    resource1.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
    resource1.descriptor = bucketName;

    let resource2 = statement.resource.add();
    resource2.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
    resource2.descriptor = `${bucketName}/*`;

    return statement;
  }

  /**
   * Statement that allows everyone to execute s3:GetObject method on passed bucket
   *
   * @param {String} bucketName
   * @returns {Statement}
   * @private
   */
  static getPublicPolicyStatement(bucketName) {
    let statement = Core.AWS.IAM.Factory.create('statement');
    statement.principal = '*';

    let action = statement.action.add();
    action.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
    action.action = 'GetObject';

    let resource = statement.resource.add();
    resource.service = Core.AWS.Service.SIMPLE_STORAGE_SERVICE;
    resource.descriptor = `${bucketName}/*`;

    return statement;
  }

  /**
   * @todo - revise Error / Index docs
   *
   * @param {String} bucketName
   * @returns {Object}
   */
  static getStaticWebsiteConfig(bucketName) {
    return {
      Bucket: bucketName,
      WebsiteConfiguration: {
        ErrorDocument: {
          Key: 'errors/4xx.html',
        },
        IndexDocument: {
          Suffix: 'index.html',
        },
      },
    };
  }

  /**
   * @returns {Number}
   */
  static get TMP_DAYS_LIFECYCLE() {
    return 1;
  }

  /**
   * @param {String} bucketName
   * @returns {Boolean}
   */
  static isBucketTmp(bucketName) {
    return bucketName.indexOf(S3Service.TMP_BUCKET) !== -1;
  }

  /**
   * @param {String} bucketName
   * @returns {Boolean}
   */
  static isBucketPublic(bucketName) {
    return bucketName.indexOf(S3Service.PUBLIC_BUCKET) !== -1;
  }
}
