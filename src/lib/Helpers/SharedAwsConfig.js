/**
 * Created by AlexanderC on 8/26/15.
 */

'use strict';

import AWS from 'aws-sdk';
import {Exec} from './Exec';
import {Env} from './Env';
import path from 'path';
import {_extend as extend} from 'util';
import {Prompt} from './Terminal/Prompt';
import FS from 'fs';
import os from 'os';
import process from 'process';

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
   * @returns {SharedAwsConfig}
   */
  addProvider(provider) {
    this._providers.push(provider);

    return this;
  }

  /**
   * @returns {*[]}
   */
  static get ACCOUNT_ID_FROM_USER_ARN_EXTRACTOR_REGEX() {
    return [/^.*:(\d+):(root|(user\/.*))$/i, '$1'];
  }

  /**
   * @param {Object} config
   * @param {Function} cb
   */
  refillPropertyConfigIfNeeded(config, cb) {
    if (!config.aws.accessKeyId || !config.aws.secretAccessKey ||
      config.aws.accessKeyId === SharedAwsConfig.DEFAULT_ACCESS_KEY ||
      config.aws.secretAccessKey === SharedAwsConfig.DEFAULT_SECRET_ACCESS_KEY) {

      console.warn('You should set real AWS keys in order to use it in production');

      config.aws = this.choose();

      this.guessAccountId(config.aws, (error, accountId) => {
        config.awsAccountId = accountId || config.awsAccountId;

        cb(true);
      });
    } else {
      cb(false);
    }
  }

  /**
   * @param {Object} awsCredentials
   * @param {Function} cb
   */
  guessAccountId(awsCredentials, cb) {
    try {
      let iam = new AWS.IAM(awsCredentials);

      iam.getUser({}, (error, data) => {
        if (error) {
          cb(error, null);
          return;
        }

        if (!data.User || !data.User.Arn) {
          cb(null, null);
          return;
        }

        cb(null, data.User.Arn.replace(...SharedAwsConfig.ACCOUNT_ID_FROM_USER_ARN_EXTRACTOR_REGEX));
      });
    } catch (error) {
      cb(error, null);
    }
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
        credentials.accessKeyId = answer || SharedAwsConfig.DEFAULT_ACCESS_KEY;
      });
    }

    if (!credentials.secretAccessKey) {
      let prompt = new Prompt('AWS secret access key');
      prompt.syncMode = true;

      prompt.readHidden((answer) => {
        credentials.secretAccessKey = answer || SharedAwsConfig.DEFAULT_SECRET_ACCESS_KEY;
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

    sifCredentials.loadDefaultFilename = sifCredentials.loadDefaultFilename || () => {
      sifCredentials.filename = SharedAwsConfig.AWS_GLOB_CFG_FILE;
    };

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
          let cmdPipe = Env.isWin ? '2 > NUL' : '2>/dev/null';

          let accessKeyIdConfigureCmd = `aws configure get aws_access_key_id ${cmdPipe}`;
          let secretAccessKeyConfigureCmd = `aws configure get aws_secret_access_key ${cmdPipe}`;
          let regionConfigureCmd = `aws configure get region ${cmdPipe}`;


          let accessKeyIdResult = new Exec(accessKeyIdConfigureCmd).runSync();
          let secretAccessKeyResult = new Exec(secretAccessKeyConfigureCmd).runSync();
          let regionResult = new Exec(regionConfigureCmd).runSync();

          this.accessKeyId = accessKeyIdResult.succeed ? accessKeyIdResult.result : null;
          this.secretAccessKey = secretAccessKeyResult.succeed ? secretAccessKeyResult.result : null;
          this.region = regionResult.succeed ? regionResult.result : null;
        },
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
      new SharedAwsConfig.AwsCliConfig(),
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
    let sharedCredentialsFile = env['AWS_SHARED_CREDENTIALS_FILE'];
    let home = env.HOME ||
      env.USERPROFILE ||
      (env.HOMEPATH ? ((env.HOMEDRIVE || 'C:/') + env.HOMEPATH) : null);

    if (!home) {
      home = '~/';
    }

    return sharedCredentialsFile || path.join(home, '.aws', 'credentials');
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_ACCESS_KEY() {
    return '[YOUR_AWS_ACCESS_KEY]';
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_SECRET_ACCESS_KEY() {
    return '[YOUR_AWS_SECRET_ACCESS_KEY]';
  }
}
