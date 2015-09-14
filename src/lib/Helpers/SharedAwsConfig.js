/**
 * Created by AlexanderC on 8/26/15.
 */

'use strict';

import AWS from 'aws-sdk';
import exec from 'sync-exec';

export class SharedAwsConfig {
  constructor() {
    this._providers = SharedAwsConfig.DEFAULT_PROVIDERS;
    this._credentials = null;
  }

  /**
   * @returns {Object[]}
   */
  get providers() {
    return this._providers;
  }

  /**
   * @param {Object} provider
   */
  addProvider(provider) {
    this._providers = provider;
  }

  /**
   * @returns {Object}
   */
  guess() {
    if (this._credentials) {
      return this._credentials;
    }

    for (let i in this._providers) {
      if (!this._providers.hasOwnProperty(i)) {
        continue;
      }

      let provider = this._providers[i];

      try {
        provider.refresh();
      } catch(e) {
        // do nothing...
      }
    }

    return this._chooseCredentials(this._providers);
  }

  /**
   * @param {Object[]} providers
   * @returns {Object}
   * @private
   */
  _chooseCredentials(providers) {
    let maxWeight = 0;
    let credentials = {
      accessKeyId: null,
      secretAccessKey: null,
      region: null,
    };

    for (let i in providers) {
      if (!providers.hasOwnProperty(i)) {
        continue;
      }

      let provider = providers[i];
      let weight = this._getWeight(provider);

      if (maxWeight < weight) {
        maxWeight = weight;

        credentials.accessKeyId = provider.accessKeyId;
        credentials.secretAccessKey = provider.secretAccessKey;
        credentials.region = provider.region || 'us-west-2';
      }
    }

    this._credentials = credentials;

    return credentials;
  }

  /**
   * @param {Object} provider
   * @returns {number}
   * @private
   */
  _getWeight(provider) {
    return (provider.accessKeyId ? 2 : 0) +
      (provider.secretAccessKey ? 2 : 0) +
      (provider.region ? 1 : 0);
  }

  /**
   * @returns {Function}
   * @constructor
   */
  static get AwsCliConfig() {
    return function() {
      return {
        accessKeyId: null,
        secretAccessKey: null,
        region: null,
        refresh: function() {
          this.accessKeyId = exec('aws configure get aws_access_key_id 2>/dev/null').stdout.toString().trim();
          this.secretAccessKey = exec('aws configure get aws_secret_access_key 2>/dev/null').stdout.toString().trim();
          this.region = exec('aws configure get region 2>/dev/null').stdout.toString().trim();
        }
      };
    };
  }

  /**
   * @returns {Object[]}
   */
  static get DEFAULT_PROVIDERS() {
    return [
      new AWS.EnvironmentCredentials(),
      new AWS.SharedIniFileCredentials(),
      new AWS.FileSystemCredentials('~/.aws/config'),
      new SharedAwsConfig.AwsCliConfig
    ];
  }
}
