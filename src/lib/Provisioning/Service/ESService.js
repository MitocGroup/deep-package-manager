/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {AbstractService} from './AbstractService';
import {SQSService} from './SQSService';
import {FailedToCreateEsDomainException} from './Exception/FailedToCreateEsDomainException';
import objectMerge from 'object-merge';

/**
 * Elasticsearch service
 */
export class ESService extends AbstractService {
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
   * @returns {String}
   */
  static get RUM_DOMAIN_NAME() {
    return 'rum';
  }

  /**
   * @returns {String}
   */
  static get CLIENT_DOMAIN_NAME() {
    return 'client';
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
   * @returns {ESService}
   */
  _setup(services) {
    let oldDomains = {};
    let domainsConfig = {};
    let rum = services.find(SQSService).getRumConfig();
    let search = this.searchConfig;

    if (this._isUpdate) {
      oldDomains = this._config.domains;
    }

    if (rum.enabled && !oldDomains.hasOwnProperty(ESService.RUM_DOMAIN_NAME)) {
      domainsConfig[ESService.RUM_DOMAIN_NAME] = ESService.DOMAINS_CONFIG[ESService.RUM_DOMAIN_NAME];
    }

    if (search.enabled && !oldDomains.hasOwnProperty(ESService.CLIENT_DOMAIN_NAME)) {
      domainsConfig[ESService.CLIENT_DOMAIN_NAME] = ESService.STD_CLUSTER_CONFIG;
    }

    this._createDomains(
      domainsConfig
    )((domains) => {
      this._config.domains = objectMerge(oldDomains, domains);

      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {ESService}
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
   * @returns {ESService}
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
   * @private
   */
  get searchConfig() {
    let globalsConfig = this.property.config.globals;
    let search = {
      enabled: false,
    };

    if (globalsConfig.search) {
      search = globalsConfig.search;
    }

    return search;
  }

  /**
   * @returns {Object}
   * @private
   */
  static get DOMAINS_CONFIG() {
    let config = {};

    config[ESService.RUM_DOMAIN_NAME] = ESService.STD_CLUSTER_CONFIG;

    return config;
  }

  /**
   * @returns {{ElasticsearchClusterConfig: {InstanceType: string, InstanceCount: number, DedicatedMasterEnabled: boolean, ZoneAwarenessEnabled: boolean}, EBSOptions: {EBSEnabled: boolean, VolumeType: string, VolumeSize: number, Iops: number}, SnapshotOptions: {AutomatedSnapshotStartHour: number}}}
   */
  static get STD_CLUSTER_CONFIG() {
    return {
      ElasticsearchClusterConfig: {
        InstanceType: 't2.micro.elasticsearch',
        InstanceCount: 1,
        DedicatedMasterEnabled: false,
        ZoneAwarenessEnabled: false,
      },
      EBSOptions: {
        EBSEnabled: true,
        VolumeType: 'gp2',
        VolumeSize: 10,
        Iops: 0,
      },
      SnapshotOptions: {
        AutomatedSnapshotStartHour: 0,
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
        domainName,
        this.name(),
        '',
        AbstractService.DELIMITER_HYPHEN_LOWER_CASE
      );
      params.AccessPolicies = this._getDomainAccessPolicy(domainName).toString();

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

  /**
   * @param {String} domainName
   * @returns {Core.AWS.IAM.Policy}
   */
  _getDomainAccessPolicy(domainName) {
    let policy = new Core.AWS.IAM.Policy();
    let readOnlyStatement = this.generateAllowActionsStatement(['ESHttpGet', 'ESHttpHead',]);
    let safeWriteStatement = this.generateAllowActionsStatement(['ESHttpGet', 'ESHttpHead', 'ESHttpPost',], true);

    readOnlyStatement.principal = {AWS: ['*',],};
    safeWriteStatement.principal = {AWS: ['*',],};

    policy.statement.add(readOnlyStatement);
    policy.statement.add(safeWriteStatement);

    return policy;
  }

  /**
   * @params {String[]|Array|*} actions
   * @param {Boolean} safeActionsOnly
   * @returns {Core.AWS.IAM.Statement}
   */
  generateAllowActionsStatement(actions, safeActionsOnly = false) {
    let policy = new Core.AWS.IAM.Policy();
    let statement = policy.statement.add();

    actions.forEach((actionName) => {
      statement.action.add(Core.AWS.Service.ELASTIC_SEARCH, actionName);
    });

    if (safeActionsOnly) {
      ['*/_search', '*/*/_search', '*/_suggest',].forEach((type) => {
        statement.resource.add(
          Core.AWS.Service.ELASTIC_SEARCH,
          this.provisioning.elasticSearch.config.region,
          this.awsAccountId,
          `domain/${this._getGlobalResourceMask('', AbstractService.DELIMITER_HYPHEN_LOWER_CASE)}/${type}`
        );
      });
    } else {
      statement.resource.add(
        Core.AWS.Service.ELASTIC_SEARCH,
        this.provisioning.elasticSearch.config.region,
        this.awsAccountId,
        `domain/${this._getGlobalResourceMask('', AbstractService.DELIMITER_HYPHEN_LOWER_CASE)}`
      );
    }

    return statement;
  }
}
