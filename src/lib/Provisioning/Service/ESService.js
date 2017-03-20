/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {AbstractService} from './AbstractService';
import {SQSService} from './SQSService';
import {FailedToCreateEsDomainException} from './Exception/FailedToCreateEsDomainException';
import {FailedToUpdateEsDomainException} from './Exception/FailedToUpdateEsDomainException';
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
   * @param {Core.Generic.ObjectStorage} services
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
      
      // override ES version if available
      if (search.es && search.es.version) {
        domainsConfig[ESService.CLIENT_DOMAIN_NAME].ElasticsearchVersion = search.es.version;
      }
    }

    this._createDomains(
      domainsConfig
    )((domains) => {
      this._config.domains = objectMerge(oldDomains, domains);
      
      // update to a new version if setup
      if (search.enabled && search.es && search.es.version
        && oldDomains.hasOwnProperty(ESService.CLIENT_DOMAIN_NAME)
        && oldDomains[ESService.CLIENT_DOMAIN_NAME].ElasticsearchVersion !== search.es.version) {
        
        // @todo Remove this when ES version update available
        // Figure out a way to update ES version without data loss
        console.info(
          `ElasticSearch domain '${oldDomains[ESService.CLIENT_DOMAIN_NAME].DomainName}'` +
          `version update (to v${search.es.version}) is not supported by 'es.updateElasticsearchDomainConfig()'`
        );
        this._ready = true;
        return;
        
        // this._updateSearchDomainVersion(
        //   oldDomains[ESService.CLIENT_DOMAIN_NAME],
        //   search.es.version,
        //   () => {
        //     console.info(
        //       `ElasticSearch domain '${oldDomains[ESService.CLIENT_DOMAIN_NAME].DomainName}' ` +
        //       `updated to v${search.es.version}`
        //     );
        //     
        //     this._config.domains[ESService.CLIENT_DOMAIN_NAME].ElasticsearchVersion = search.es.version;
        //     this._ready = true;
        //   }
        // );
      } else {
        this._ready = true;
      }
    });

    return this;
  }
  
  /**
   * @param {*} domainConfig
   * @param {String}  newVersion
   * @param {Function} onReady
   *
   * @private
   */
  _updateSearchDomainVersion(domainConfig, newVersion, onReady) {
    let elasticSearch = this.provisioning.elasticSearch;
    let params = {
      DomainName: domainConfig.DomainName,
      AccessPolicies: domainConfig.AccessPolicies,
      AdvancedOptions: domainConfig.AdvancedOptions,
      EBSOptions: domainConfig.EBSOptions,
      ElasticsearchClusterConfig: domainConfig.ElasticsearchClusterConfig,
      SnapshotOptions: domainConfig.SnapshotOptions,
    };
    
    elasticSearch.updateElasticsearchDomainConfig(params, (error, data) => {
      if (error) {
        throw new FailedToUpdateEsDomainException(
          domainConfig.DomainName,
          error
        );
      }
      
      onReady(data.DomainConfig);
    });
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
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
   * @param {Core.Generic.ObjectStorage} services
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
   * @returns {*}
   *
   * Note that 't2.micro.elasticsearch' instance don't support
   * ElasticSearch v5.x
   *
   * @see http://docs.aws.amazon.com/elasticsearch-service/latest/developerguide/what-is-amazon-elasticsearch-service.html#aes-choosing-version
   */
  static get STD_CLUSTER_CONFIG() {
    return {
      ElasticsearchClusterConfig: {
        InstanceType: 't2.small.elasticsearch',
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
      ElasticsearchVersion: '2.3', // 1.5, 2.3, 5.1 
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
   * @params {Boolean} safeActionsOnly
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
