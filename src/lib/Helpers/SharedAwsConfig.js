/**
 * Created by AlexanderC on 8/26/15.
 */

'use strict';

import AWS from 'aws-sdk';
import exec from 'sync-exec';
import path from 'path';
import {_extend as extend} from 'util';
import {Prompt} from './Terminal/Prompt';
import FS from 'fs';

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
   * @param {Boolean} requestOnMissing
   * @returns {Object}
   */
  choose(requestOnMissing = true) {
    let chosenCredentials = null;
    let guessedCredentials = this.guess();

    let credentials = extend({
      'default': this.guess(),
    }, this._parseAwsCredentialsFile([guessedCredentials.accessKeyId]));

    let awsProfiles = Object.keys(credentials);

    if (awsProfiles.length === 1) {
      return requestOnMissing
        ? this.askForCredentialsIfMissing(guessedCredentials)
        : guessedCredentials;
    }

    let prompt = new Prompt('Choose the AWS profile to be used');
    prompt.syncMode = true;

    // it is sync!
    prompt.readChoice((awsProfile) => {
      chosenCredentials = credentials[awsProfile];
    }, awsProfiles.sort());

    return requestOnMissing
      ? this.askForCredentialsIfMissing(chosenCredentials)
      : chosenCredentials;
  }

  /**
   * @param {Object} credentials
   * @returns {Object}
   */
  askForCredentialsIfMissing(credentials) {
    if (!credentials.accessKeyId) {
      let prompt = new Prompt('AWS access key');
      prompt.syncMode = true;

      prompt.read((answer) => {
        credentials.accessKeyId = answer;
      });
    }

    if (!credentials.secretAccessKey) {
      let prompt = new Prompt('AWS secret access key');
      prompt.syncMode = true;

      prompt.readHidden((answer) => {
        credentials.secretAccessKey = answer;
      });
    }

    if (!credentials.region) {
      let prompt = new Prompt('AWS region');
      prompt.syncMode = true;

      prompt.readWithDefaults((answer) => {
        credentials.region = answer;
      }, SharedAwsConfig.DEFAULT_REGION);
    }

    return credentials;
  }

  /**
   * @param {String[]} filterAccessKeys
   * @returns {Object}
   * @private
   */
  _parseAwsCredentialsFile(filterAccessKeys = []) {
    let resultCredentials = {};

    let sifCredentials = new AWS.SharedIniFileCredentials();
    sifCredentials.loadDefaultFilename();

    let guessedIniFile = sifCredentials.filename;

    if (!FS.existsSync(guessedIniFile)) {
      return {};
    }

    let credentials = AWS.util.ini.parse(AWS.util.readFileSync(guessedIniFile));

    for (let profile in credentials) {
      if (!credentials.hasOwnProperty(profile)) {
        continue;
      }

      let credentialsObj = credentials[profile];

      // @todo: remove this case?
      if (filterAccessKeys.indexOf(credentialsObj.aws_access_key_id) !== -1) {
        continue;
      }

      resultCredentials[profile] = {
        accessKeyId: credentialsObj.aws_access_key_id,
        secretAccessKey: credentialsObj.aws_secret_access_key,
        region: SharedAwsConfig.DEFAULT_REGION,
      };
    }

    return resultCredentials;
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
        credentials.region = provider.region || SharedAwsConfig.DEFAULT_REGION;
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
      new AWS.FileSystemCredentials(SharedAwsConfig.AWS_GLOB_CFG_FILE),
      new SharedAwsConfig.AwsCliConfig
    ];
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_REGION() {
    return 'us-west-2';
  }

  /**
   * @returns {String}
   */
  static get AWS_GLOB_CFG_FILE() {
    let env = process.env;
    let home = env.HOME ||
      env.USERPROFILE ||
      (env.HOMEPATH ? ((env.HOMEDRIVE || 'C:/') + env.HOMEPATH) : null);

    if (!home) {
      home = '~/';
    }

    return path.join(home, '.aws', 'credentials');
  }
}
