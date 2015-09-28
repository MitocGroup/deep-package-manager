/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from '@mitocgroup/deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateElasticacheClusterException} from './Exception/FailedToCreateElasticacheClusterException';
import {Hash} from '../../Helpers/Hash';

/**
 * Elasticache service
 */
export class ElasticacheService extends AbstractService {
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
    return Core.AWS.Service.ELASTIC_CACHE;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.all(),
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ElasticacheService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    //this._createCluster(
    //    this.awsAccountId,
    //    this.appIdentifier
    //)(function(dsn) {
    //    this._config = {
    //        dsn: dsn
    //    };
    //
    //    this._ready = true;
    //}.bind(this));

    this._ready = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ElasticacheService}
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ElasticacheService}
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

  /**
   * @param {String} awsAccountId
   * @param {String} appIdentifier
   * @returns {Function}
   * @private
   */
  _createCluster(awsAccountId, appIdentifier) {
    let syncStack = new AwsRequestSyncStack();
    let ec = this.provisioning.elasticCache;

    let clusterId = ElasticacheService._buildClusterId(awsAccountId, appIdentifier);

    let parameters = {
      CacheClusterId: clusterId,

      //PreferredAvailabilityZone: ec.config.region, // @todo: figure out availability zones...
      Engine: ElasticacheService.ENGINE,
      CacheNodeType: ElasticacheService.INSTANCE,
      NumCacheNodes: 1,
    };

    syncStack.push(ec.createCacheCluster(parameters), function(error, data) {
      if (error) {
        throw new FailedToCreateElasticacheClusterException(clusterId, error);
      }
    }.bind(this));

    return function(callback) {
      return syncStack.join().ready(function() {
        this._acquireEndpoint(clusterId, callback);
      }.bind(this));
    }.bind(this);
  }

  /**
   * @param {String} clusterId
   * @param {Function} callback
   * @private
   */
  _acquireEndpoint(clusterId, callback) {
    let dsn = '';
    let succeed = false;
    let ec = this.provisioning.elasticCache;
    let innerSyncStack = new AwsRequestSyncStack();

    let describeParameters = {
      CacheClusterId: clusterId,
      ShowCacheNodeInfo: true,
    };

    innerSyncStack.push(ec.describeCacheClusters(describeParameters), function(error, data) {
      if (error) {
        throw new FailedToCreateElasticacheClusterException(clusterId, error);
      }

      let nodes = data.CacheClusters[0].CacheNodes;

      if (nodes.length > 0) {
        let endpoint = nodes[0].Endpoint;
        dsn = `redis://${endpoint.Address}:${endpoint.Port}`;
        succeed = true;
      }
    }.bind(this));

    innerSyncStack.join().ready(function() {
      if (succeed) {
        callback(dsn);
      } else {
        setTimeout(function() {
          this._acquireEndpoint(clusterId, callback);
        }.bind(this), ElasticacheService.WAIT_TIME);
      }
    }.bind(this));
  }

  /**
   * @returns {Number}
   */
  static get WAIT_TIME() {
    return 2000;
  }

  /**
   * @returns {String}
   */
  static get INSTANCE() {
    return 'cache.t2.micro';
  }

  /**
   * @returns {String}
   */
  static get ENGINE() {
    return 'redis';
  }

  /**
   * @param {String} awsAccountId
   * @param {String} appIdentifier
   * @private
   *
   * @todo: figure out why we are limited to 20 chars
   */
  static _buildClusterId(awsAccountId, appIdentifier) {
    let accountHash = Hash.crc32(awsAccountId.toString());
    let propertyHash = Hash.crc32(appIdentifier.toString());
    let propertyParts = appIdentifier.toString().replace(/[^a-zA-Z0-9-]+/, '').split('');
    let propertySuffix = `${propertyParts.shift()}${propertyParts.pop()}`;

    return `d${accountHash}-${propertyHash}${propertySuffix}`;
  }
}
