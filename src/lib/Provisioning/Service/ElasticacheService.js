/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {FailedToCreateElasticacheClusterException} from './Exception/FailedToCreateElasticacheClusterException';
import {Hash} from '../../Helpers/Hash';
import {FailedToRetrieveDefaultSecurityGroupException} from './Exception/FailedToRetrieveDefaultSecurityGroupException';
import {FailedToRetrieveLambdaSubnetGroupException} from './Exception/FailedToRetrieveLambdaSubnetGroupException';

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

    this._getDefaultSecurityGroupId((securityGroupId) => {
      this._getLambdaSubnetGroup((subnetId) => {
        this._createCluster(
          this.awsAccountId,
          this.appIdentifier,
          securityGroupId
        )((clusterId, dsn) => {
          this._config.clusterId = clusterId;
          this._config.dsn = dsn;
          this._config.securityGroupId = securityGroupId;
          this._config.subnetId = subnetId;

          this._ready = true;
        });
      });
    });

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
   * @param {Function} cb
   * @private
   */
  _getLambdaSubnetGroup(cb) {
    let payload = {
      CacheSubnetGroupName: 'lambda',
    };

    this._provisioning.elasticCache.describeCacheSubnetGroups(payload, (error, data) => {
      if (error) {
        throw new FailedToRetrieveLambdaSubnetGroupException(error);
      }

      if (data.CacheSubnetGroups.length <= 0) {
        throw new FailedToRetrieveLambdaSubnetGroupException('No Lambda subnet group assigned');
      }

      let subnets = data.CacheSubnetGroups[0].Subnets;

      if (subnets.length <= 0) {
        throw new FailedToRetrieveLambdaSubnetGroupException('No Lambda subnets available');
      }

      cb(subnets[0].SubnetIdentifier);
    });
  }

  /**
   * @param {Function} cb
   * @private
   */
  _getDefaultSecurityGroupId(cb) {
    let payload = {
      GroupNames: ['default',],
    };

    this._provisioning.ec2.describeSecurityGroups(payload, (error, data) => {
      if (error) {
        throw new FailedToRetrieveDefaultSecurityGroupException(error);
      }

      if (data.SecurityGroups.length <= 0) {
        throw new FailedToRetrieveDefaultSecurityGroupException('No default security group assigned');
      }

      cb(data.SecurityGroups[0].GroupId);
    });
  }

  /**
   * @param {String} awsAccountId
   * @param {String} appIdentifier
   * @param {String} securityGroupId
   * @returns {Function}
   * @private
   */
  _createCluster(awsAccountId, appIdentifier, securityGroupId) {
    let syncStack = new AwsRequestSyncStack();
    let ec = this.provisioning.elasticCache;

    let clusterId = this.generateAwsResourceName(
      'ec',
      Core.AWS.Service.ELASTIC_CACHE,
      '',
      AbstractService.DELIMITER_HYPHEN_LOWER_CASE
    );

    let parameters = {
      CacheClusterId: clusterId,
      AutoMinorVersionUpgrade: true,
      Engine: ElasticacheService.ENGINE,
      CacheNodeType: ElasticacheService.INSTANCE,
      NumCacheNodes: ElasticacheService.CACHE_NODES,
      SecurityGroupIds: [securityGroupId,],
    };

    syncStack.push(ec.createCacheCluster(parameters), (error, data) => {
      if (error) {
        throw new FailedToCreateElasticacheClusterException(clusterId, error);
      }
    });

    return (callback) => {
      return syncStack.join().ready(() => {
        this._acquireEndpoint(clusterId, callback);
      });
    };
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

    innerSyncStack.push(ec.describeCacheClusters(describeParameters), (error, data) => {
      if (error) {
        throw new FailedToCreateElasticacheClusterException(clusterId, error);
      }

      let nodes = data.CacheClusters[0].CacheNodes;

      if (nodes.length > 0) {
        let endpoint = nodes[0].Endpoint;
        dsn = `${endpoint.Address}:${endpoint.Port}`;
        succeed = true;
      }
    });

    innerSyncStack.join().ready(() => {
      if (succeed) {
        callback(clusterId, dsn);
      } else {
        setTimeout(() => {
          this._acquireEndpoint(clusterId, callback);
        }, ElasticacheService.WAIT_TIME);
      }
    });
  }

  /**
   * @returns {Number}
   */
  static get WAIT_TIME() {
    return 2000;
  }

  /**
   * @returns {Number}
   */
  static get CACHE_NODES() {
    return 1;
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
}
