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
import {FailedToCreateCloudSearchDomainSuggestersException} from './Exception/FailedToCreateCloudSearchDomainSuggestersException';
import {DynamoDBService} from './DynamoDBService';
import {MissingDynamoDBTableUsedInCloudSearchException} from './Exception/MissingDynamoDBTableUsedInCloudSearchException';
import {AmbiguousCloudSearchDomainException} from './Exception/AmbiguousCloudSearchDomainException';
import {FailedToRetrieveCloudSearchDistributionException} from './Exception/FailedToRetrieveCloudSearchDistributionException';
import {FailedToRunCloudSearchDocumentsIndexingException} from './Exception/FailedToRunCloudSearchDocumentsIndexingException';

export class CloudSearchService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);

    this._searchConfig = this._generateSearchConfig();
    this._domainsToWaitFor = {};
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
          let suggestConfig = {};

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

            if (fieldOptions.autocomplete) {
              suggestConfig[field] = {
                DocumentSuggesterOptions: {
                  SourceField: searchConfig[field].IndexFieldName,
                  FuzzyMatching: fieldOptions.autocomplete.fuzziness || CloudSearchService.ALLOWED_FUZZINESS[0],
                },
                SuggesterName: searchConfig[field].IndexFieldName,
              };
            }
          }

          domainConfig[domainName] = {
            search: searchConfig,
            suggest: suggestConfig,
          };
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
    this._fillConfigTables();

    console.log(
      `Waiting for the following CloudSearch domains to be ready: ${Object.keys(this._domainsToWaitFor).join(', ')}`
    );

    this._waitForDomainsReady(() => {
      this._readyTeardown = true;
    });

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
   * @param {Number} estTime
   * @private
   */
  _waitForDomainsReady(cb, estTime = null) {
    estTime = null === estTime ? 11 * 60 : estTime;

    let domainsStack = new AwsRequestSyncStack();
    let cloudsearch = this.provisioning.cloudSearch;
    let domains = Object.keys(this._domainsToWaitFor);

    if (domains.length <= 0) {
      cb();
      return;
    }

    cloudsearch.describeDomains({DomainNames: domains,}, (error, data) => {
      if (error) {
        throw new FailedToRetrieveCloudSearchDistributionException(error);
      }

      for (let i in data.DomainStatusList) {
        if (!data.DomainStatusList.hasOwnProperty(i)) {
          continue;
        }

        let domainInfo = data.DomainStatusList[i];
        let domainName = domainInfo.DomainName;

        if (false === domainInfo.Processing
          && domainInfo.DocService.Endpoint
          && domainInfo.SearchService.Endpoint) {

          this._config[this._domainsToWaitFor[domainName]].endpoints = {
            push: domainInfo.DocService.Endpoint,
            search: domainInfo.SearchService.Endpoint,
          };

          delete this._domainsToWaitFor[domainName];
        }
      }

      let estTimeMinutes = (estTime / 60);

      if (estTimeMinutes <= 0) {
        console.log('almost done...');
      } else {
        console.log(`${estTimeMinutes} minutes remaining...`);
      }

      setTimeout(() => {
        this._waitForDomainsReady(cb, estTime - 30);
      }, 1000 * 30);
    });
  }

  /**
   * @returns {CloudSearchService}
   * @private
   */
  _fillConfigTables() {
    let dynamoDbService = this.provisioning.services.find(DynamoDBService);
    let dynamoDbTables = this.provisioning.config[dynamoDbService.name()].tablesNames;

    for (let domainName in this._config) {
      if (!this._config.hasOwnProperty(domainName)) {
        continue;
      }

      if (!dynamoDbTables.hasOwnProperty(domainName)) {
        throw new MissingDynamoDBTableUsedInCloudSearchException(domainName);
      }

      this._config[domainName].table = dynamoDbTables[domainName];
    }

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
    let suggestionsStack = indexesStack.addLevel();
    let activationStack = suggestionsStack.addLevel();
    let cloudsearch = this.provisioning.cloudSearch;

    for (let microserviceIdentifier in this._searchConfig.domains) {
      if (!this._searchConfig.domains.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let domains = this._searchConfig.domains[microserviceIdentifier];

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

          if (config.hasOwnProperty(domain)) {
            throw new AmbiguousCloudSearchDomainException(
              microserviceIdentifier,
              domain
            );
          }

          config[domain] = {
            name: domainName,
            table: null,
            endpoints: {

              // these properties are empty at this step...
              //push: domainInfo.DocService.Endpoint,
              //search: domainInfo.SearchService.Endpoint,
            },
            indexes: {},
            suggesters: {},
          };

          this._domainsToWaitFor[domainName] = domain;

          let indexes = this._searchConfig.config[microserviceIdentifier][domain].search;

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

              config[domain].indexes[indexName] = indexOptions.IndexFieldName;
            });
          }

          let suggestions = this._searchConfig.config[microserviceIdentifier][domain].suggest;

          for (let suggestionName in suggestions) {
            if (!suggestions.hasOwnProperty(suggestionName)) {
              continue;
            }

            let suggestionsOptions = suggestions[suggestionName];

            let payload = {
              DomainName: domainName,
              Suggester: suggestionsOptions,
            };

            suggestionsStack.push(cloudsearch.defineSuggester(payload), (error) => {
              if (error) {
                throw new FailedToCreateCloudSearchDomainSuggestersException(error);
              }

              config[domain].suggesters[suggestionName] = suggestionsOptions.SuggesterName;
            });
          }

          activationStack.push(cloudsearch.indexDocuments({DomainName: domainName,}), (error) => {
            if (error) {
              throw new FailedToRunCloudSearchDocumentsIndexingException(domainName, error);
            }
          });
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

  /**
   * @returns {String[]}
   */
  static get ALLOWED_FUZZINESS() {
    return ['none', 'low', 'high'];
  }
}
