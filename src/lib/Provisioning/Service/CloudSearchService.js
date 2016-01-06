/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import Core from 'deep-core';
import {Inflector} from './Helpers/Inflector';
import {FailedToCreateCloudSearchDomainException} from './Exception/FailedToCreateCloudSearchDomainException';
import {FailedToCreateCloudSearchDomainIndexesException} from './Exception/FailedToCreateCloudSearchDomainIndexesException';

export class CloudSearchService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._searchConfig = this._generateSearchConfig();
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.CLOUD_SEARCH;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.ANY
    ];
  }

  /**
   * @returns {Object}
   */
  get searchConfig() {
    return this._searchConfig;
  }

  /**
   * @returns {Object}
   * @private
   */
  _generateSearchConfig() {
    let config = {
      domains: {},
      config: {},
    };
    let microservices = this.property.microservices;

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];
      let searchSchema = microservice.searchSchema;

      if (searchSchema) {
        config.domains[microservice.identifier] = [];

        let domainConfig = {};

        for (let domainName in searchSchema) {
          if (!searchSchema.hasOwnProperty(domainName)) {
            continue;
          }

          config.domains[microservice.identifier].push(domainName);

          let searchInfo = searchSchema[domainName];
          let searchConfig = {};

          if (searchInfo.timestamp) {
            let fields = CloudSearchService.TIMESTAMP_FIELDS;

            for (let k in fields) {
              if (!fields.hasOwnProperty(k)) {
                continue;
              }

              let field = fields[k];

              searchConfig[field] = {
                IndexFieldName: Inflector.cloudSearchFieldName(field),
                IndexFieldType: 'date',
                DateOptions: {
                  FacetEnabled: true,
                  ReturnEnabled: true,
                  SearchEnabled: true,
                  SortEnabled: true,
                },
              };
            }
          }

          for (let field in searchInfo.indexes) {
            if (!searchInfo.indexes.hasOwnProperty(field)) {
              continue;
            }

            let fieldOptions = searchInfo.indexes[field];

            searchConfig[field] = {
              IndexFieldName: Inflector.cloudSearchFieldName(field),
              IndexFieldType: fieldOptions.type,
            };

            if (fieldOptions.options && Object.keys(fieldOptions.options).length > 0) {
              let optionsKey = Inflector.cloudSearchOptionsKey(fieldOptions.type);

              searchConfig[field][optionsKey] = fieldOptions.options;
            }
          }

          domainConfig[domainName] = searchConfig;
        }

        config.config[microservice.identifier] = domainConfig;
      }
    }

    return config;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudSearchService}
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._createDomains((domainsConfig) => {
      this._config = domainsConfig;

      this._ready = true;
    });

    return this;
  }

  /**
   * @parameter {Core.Generic.ObjectStorage} services
   * @returns {CloudSearchService}
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
   * @returns {CloudSearchService}
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
  _createDomains(cb) {
    let config = {};
    let domainsStack = new AwsRequestSyncStack();
    let indexesStack = domainsStack.addLevel();
    let cloudsearch = this.provisioning.cloudSearch;

    for (let microserviceIdentifier in this._searchConfig.domains) {
      if (!this._searchConfig.domains.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let domains = this._searchConfig.domains[microserviceIdentifier];

      config[microserviceIdentifier] = {};

      domains.forEach((domain) => {
        let domainName = this.generateAwsResourceName(
          domain,
          Core.AWS.Service.CLOUD_SEARCH,
          microserviceIdentifier,
          AbstractService.DELIMITER_HYPHEN_LOWER_CASE
        );

        domainsStack.push(cloudsearch.createDomain({DomainName: domainName,}), (error, data) => {
          if (error) {
            throw new FailedToCreateCloudSearchDomainException(error);
          }

          let domainInfo = data.DomainStatus;

          config[microserviceIdentifier][domainName] = {
            id: domainInfo.DomainId,
            endpoints: {
              push: domainInfo.DocService.Endpoint,
              search: domainInfo.SearchService.Endpoint,
            },
            indexes: {},
          };

          let indexes = this._searchConfig.config[microserviceIdentifier][domain];

          for (let indexName in indexes) {
            if (!indexes.hasOwnProperty(indexName)) {
              continue;
            }

            let indexOptions = indexes[indexName];

            let payload = {
              DomainName: domainName,
              IndexField: indexOptions,
            };

            indexesStack.push(cloudsearch.defineIndexField(payload), (error) => {
              if (error) {
                throw new FailedToCreateCloudSearchDomainIndexesException(error);
              }

              config[microserviceIdentifier][domainName].indexes[indexName] = indexOptions.IndexFieldName;
            });
          }
        });
      });
    }

    domainsStack.join().ready(() => {
      cb(config);
    });
  }

  /**
   * @returns {String[]}
   * @constructor
   */
  static get TIMESTAMP_FIELDS() {
    return ['createdAt', 'updatedAt'];
  }

  /**
   * @returns {String}
   * @constructor
   */
  static get DEFAULT_IDX_TYPE() {
    return 'text';
  }

  /**
   * @returns {String[]}
   * @constructor
   */
  static get ALLOWED_IDX_TYPES() {
    return [
      'int', 'double', 'literal',
      'text', 'date', 'latlon',
      'int-array', 'double-array',
      'literal-array', 'text-array',
      'date-array',
    ];
  }
}
