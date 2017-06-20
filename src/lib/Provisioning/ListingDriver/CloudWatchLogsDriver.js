/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {AbstractService} from '../Service/AbstractService';
import {CloudWatchLogsService} from '../Service/CloudWatchLogsService';

export class CloudWatchLogsDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return CloudWatchLogsService.AVAILABLE_REGIONS;
  }

  /**
   * @todo: find a better way to handle API logs specific use case
   *
   * Overrides base _matchResource by adding support for custom API Gateway CloudWatch log group name
   * e.g. API-Gateway-Execution-Logs_56fh4n843h/dev
   *
   * @param {String} resource
   * @returns {Boolean}
   * @private
   */
  _matchResource(resource) {
    if (resource.indexOf(CloudWatchLogsDriver.API_GATEWAY_LOG_GROUP_PREFIX) !== -1) {
      let apiCloudWatchLogGroup = null;

      if (this._deployCfg && this._deployCfg.apigateway.api && this._deployCfg.apigateway.api.logGroupName) {
        apiCloudWatchLogGroup = this._deployCfg.apigateway.api.logGroupName;
      }

      return apiCloudWatchLogGroup ? resource === apiCloudWatchLogGroup : false;
    }

    // remove log group prefix to match generalized deep resource regexp
    let trimmedResource = resource.replace(CloudWatchLogsDriver.LAMBDA_LOG_GROUP_PREFIX, '');
    let resourceEnv = AbstractService.extractEnvFromResourceName(trimmedResource);

    // do we need to check env only for typeof hash = string ?
    if (!resourceEnv) {
      console.warn(`Cannot extract env from ${trimmedResource} resource.`);
    } else if (resourceEnv !== this._env) {
      return false;
    }

    if (typeof this._baseHash === 'function') {
      return this._baseHash.bind(this)(resource);
    } else if (this._baseHash instanceof RegExp) {
      return this._baseHash.test(trimmedResource);
    }

    return AbstractService.extractBaseHashFromResourceName(resource) === this._baseHash;
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    let responses = 0;

    CloudWatchLogsDriver.LOG_GROUP_PREFIXES.forEach((logGroupPrefix, index) => {
      this._listLogGroups(logGroupPrefix, (result) => {
        responses++;
        if (responses === CloudWatchLogsDriver.LOG_GROUP_PREFIXES.length) {
          cb(result);
        }
      });
    });
  }

  /**
   * @param {String} logGroupPrefix
   * @param {Function} cb
   * @param {String|null} nextToken
   * @private
   */
  _listLogGroups(logGroupPrefix, cb, nextToken = null) {
    let payload = {
      limit: CloudWatchLogsDriver.LIMIT,
      logGroupNamePrefix: logGroupPrefix,
    };

    if (nextToken) {
      payload.nextToken = nextToken;
    }

    this._awsService.describeLogGroups(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.logGroups) {
        if (!data.logGroups.hasOwnProperty(i)) {
          continue;
        }

        let cwlData = data.logGroups[i];
        let groupName = cwlData.logGroupName;

        this._checkPushStack(groupName, groupName, cwlData);
      }

      if (data.nextToken) {
        let nextBatchToken = data.nextToken;

        this._listLogGroups(logGroupPrefix, cb, nextBatchToken);
      } else {
        cb(null);
      }
    });
  }

  /**
   * @returns {String}
   */
  static get LAMBDA_LOG_GROUP_PREFIX() {
    return '/aws/lambda/';
  }

  /**
   * @returns {String}
   */
  static get API_GATEWAY_LOG_GROUP_PREFIX() {
    return 'API-Gateway-Execution-Logs_';
  }

  /**
   * @returns {Array}
   */
  static get LOG_GROUP_PREFIXES() {
    return [
      CloudWatchLogsDriver.LAMBDA_LOG_GROUP_PREFIX,
      CloudWatchLogsDriver.API_GATEWAY_LOG_GROUP_PREFIX,
    ];
  }

  /**
   * @returns {Number}
   */
  static get LIMIT() {
    return 50;
  }
}
