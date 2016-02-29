/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {FailedToCreateEsDomainException} from './Exception/FailedToCreateEsDomainException';
import Core from 'deep-core';

/**
 * Elasticsearch service
 */
export class ElasticsearchService extends AbstractService {
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
    return Core.AWS.Service.ELASTIC_SEARCH;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ASIA_PACIFIC_TOKYO,
      Core.AWS.Region.ASIA_PACIFIC_SEOUL,
      Core.AWS.Region.ASIA_PACIFIC_SYDNEY,
      Core.AWS.Region.SOUTH_AMERICA_SAO_PAULO,
      Core.AWS.Region.ASIA_PACIFIC_SINGAPORE,
      Core.AWS.Region.EU_FRANKFURT,
      Core.AWS.Region.EU_IRELAND,
      Core.AWS.Region.US_EAST_N_VIRGINIA,
      Core.AWS.Region.US_WEST_N_CALIFORNIA,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ElasticsearchService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._createDomains(
      this._domainsConfig
    )((domains) => {
      this._config.domains = domains;

      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ElasticsearchService}
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
   * @returns {ElasticsearchService}
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
   * @returns {Object}
   * @private
   */
  get _domainsConfig() {
    return {
      rum: {
        ElasticsearchClusterConfig: {
          InstanceType: 't2.micro.elasticsearch',
          InstanceCount: 1,
          DedicatedMasterEnabled: false,
          ZoneAwarenessEnabled: false,
        },
        EBSOptions: {
          EBSEnabled: true,
          VolumeType: 'standard',
          VolumeSize: 5,
          Iops: 0,
        },
        SnapshotOptions: {
          AutomatedSnapshotStartHour: 0,
        },
      },
    };
  }

  /**
   * @param {Object} domainsConfig
   * @returns {Function}
   * @private
   */
  _createDomains(domainsConfig) {
    let elasticSearch = this.provisioning.elasticSearch;
    let syncStack = new AwsRequestSyncStack();
    let domains = {};

    for (let domainName in domainsConfig) {
      if (!domainsConfig.hasOwnProperty(domainName)) {
        continue;
      }

      let params = domainsConfig[domainName];

      params.DomainName = this.generateAwsResourceName(
        `${domainName}`,
        this.name(),
        '',
        AbstractService.DELIMITER_HYPHEN_LOWER_CASE
      );
      // @todo - add AccessPolicies

      syncStack.push(elasticSearch.createElasticsearchDomain(params), (error, data) => {
        if (error) {
          throw new FailedToCreateEsDomainException(params.DomainName, error);
        }

        domains[domainName] = data.DomainStatus;
      });
    }

    return (callback) => {
      return syncStack.join().ready(() => {
        callback(domains);
      });
    };
  }
}

