/**
 * Created by mgoria on 02/29/16.
 */

'use strict';

import Core from 'deep-core';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {AbstractService} from './AbstractService';
import {CognitoIdentityService} from './CognitoIdentityService';
import {SQSService} from './SQSService';
import {FailedToCreateEsDomainException} from './Exception/FailedToCreateEsDomainException';

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
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    let domainsConfig = {};
    let rum = services.find(SQSService).getRumConfig();

    if (rum.enabled) {
      domainsConfig[ESService.RUM_DOMAIN_NAME] = ESService.DOMAINS_CONFIG[ESService.RUM_DOMAIN_NAME];
    }

    this._createDomains(
      domainsConfig
    )((domains) => {
      this._config.domains = domains;

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
   * @returns {Object}
   * @private
   */
  static get DOMAINS_CONFIG() {
    let config = {};

    config[ESService.RUM_DOMAIN_NAME] = {
      ElasticsearchClusterConfig: {
        InstanceType: 't2.micro.elasticsearch',
        InstanceCount: 1,
        DedicatedMasterEnabled: false,
        ZoneAwarenessEnabled: false,
      },
      EBSOptions: {
        EBSEnabled: true,
        VolumeType: 'standard',
        VolumeSize: 10,
        Iops: 0,
      },
      SnapshotOptions: {
        AutomatedSnapshotStartHour: 0,
      },
    };

    return config;
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
    let readOnlyStatement = policy.statement.add();

    // Allow Cognito identities to execute only GET and HEAD methods on an ES domain
    //readOnlyStatement.principal = { AWS: [] };
    readOnlyStatement.principal = {
      Service: Core.AWS.Service.identifier(Core.AWS.Service.LAMBDA),
    };

    CognitoIdentityService.ROLE_TYPES.forEach((roleType) => {
      let roleName = this.generateAwsResourceName(roleType, Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT);

      let roleResource = Core.AWS.IAM.Factory.create(
        'resource',
        Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT,
        this.provisioning.iam.config.region,
        this.awsAccountId,
        `role/${roleName}`
      );

      // @todo - find out why role based Principal is not acceptable by ES service
      //readOnlyStatement.principal.AWS.push(roleResource.extract());
    });

    ['ESHttpGet', 'ESHttpHead'].forEach((actionName) => {
      readOnlyStatement.action.add(Core.AWS.Service.ELASTIC_SEARCH, actionName);
    });

    let esDomainResource = readOnlyStatement.resource.add(
      Core.AWS.Service.ELASTIC_SEARCH,
      this.provisioning.elasticSearch.config.region,
      this.awsAccountId,
      `domain:${this._getGlobalResourceMask('', AbstractService.DELIMITER_HYPHEN_LOWER_CASE)}`
    );

    // Allow Lambda service to execute all http methods on an ES domain
    let readWriteStatement = policy.statement.add();

    readWriteStatement.principal = {
      Service: Core.AWS.Service.identifier(Core.AWS.Service.LAMBDA),
    };

    ['ESHttpGet', 'ESHttpHead', 'ESHttpDelete', 'ESHttpPost', 'ESHttpPut'].forEach((actionName) => {
      readWriteStatement.action.add(Core.AWS.Service.ELASTIC_SEARCH, actionName);
    });

    readWriteStatement.resource.add(esDomainResource);

    return policy;
  }
}

