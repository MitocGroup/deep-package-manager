/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import Core from 'deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {Hash} from '../../Helpers/Hash';
import {Exception} from '../../Exception/Exception';
import {Inflector} from '../../Helpers/Inflector';

/**
 * Abstract service
 */
export class AbstractService extends Core.OOP.Interface {
  /**
   * @param {Instance} provisioning
   */
  constructor(provisioning) {
    super(['name', '_setup', '_postProvision', '_postDeployProvision']);

    this._config = {};
    this._provisioning = provisioning;
    this._ready = false;
    this._readyTeardown = false;
    this._isUpdate = false;
  }

  /**
   * @param {Boolean} state
   */
  set isUpdate(state) {
    this._isUpdate = state;
  }

  /**
   * @returns {Boolean}
   */
  get isUpdate() {
    return this._isUpdate;
  }

  /**
   * @returns {string}
   */
  static get DELIMITER_UPPER_CASE() {
    return 'upperCase';
  }

  /**
   * @returns {string}
   */
  static get DELIMITER_DOT() {
    return '.';
  }

  /**
   * @returns {string}
   */
  static get DELIMITER_HYPHEN_LOWER_CASE() {
    return 'hyphenLowerCase';
  }

  /**
   * @returns {string}
   */
  static get DELIMITER_HYPHEN() {
    return '-';
  }

  /**
   * @returns {string}
   */
  static get DELIMITER_UNDERSCORE() {
    return '_';
  }

  /**
   * @returns {string}
   */
  static get AWS_RESOURCES_PREFIX() {
    return 'deep';
  }

  /**
   * @returns {RegExp}
   */
  static get AWS_RESOURCE_GENERALIZED_REGEXP() {
    let regexp = '';
    let capitalizedResourcePrefix = AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX);

    regexp += '(.*\/)?'; // case CloudFrontLogs or similar...
    regexp += `(${AbstractService.AWS_RESOURCES_PREFIX}|${capitalizedResourcePrefix})`;
    regexp += '(-|_|\.|[A-Z])';
    regexp += '.+';
    regexp += `[a-zA-Z0-9]{${AbstractService.MAIN_HASH_SIZE}}`;

    return new RegExp(`^${regexp}$`);
  }

  /**
   * @returns {RegExp}
   */
  static get AWS_RESOURCE_LISTING_REGEXP() {
    let regExp = '';
    let prefix = AbstractService.AWS_RESOURCES_PREFIX;
    let capPrefix = AbstractService.capitalizeFirst(prefix);
    let hashSize = AbstractService.MAIN_HASH_SIZE;

    regExp += `${capPrefix}[A-Z].+[A-Z].+(\\w{${hashSize}})$|`; // upperCase delimiter
    regExp += `${prefix}\\.\\w+\\.\\w+\\.(\\w{${hashSize}})$|`; // dot delimiter
    regExp += `${prefix}\\_\\w+\\_\\w+\\_(\\w{${hashSize}})$|`; // underscore delimiter
    regExp += `(${capPrefix}|${prefix})\\-\\w+\\-\\w+\\-(\\w{${hashSize}})`; // hyphen delimiter

    return new RegExp(`^${regExp}$`);
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {WaitFor}
   */
  setup(services) {
    let wait = new WaitFor();

    this._setup(services);

    wait.push(() => {
      if (this._ready) {
        this._ready = false;
        return true;
      }

      return false;
    });

    return wait;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {WaitFor}
   */
  postProvision(services) {
    let wait = new WaitFor();

    this._postProvision(services);

    wait.push(() => {
      if (this._readyTeardown) {
        this._readyTeardown = false;
        return true;
      }

      return false;
    });

    return wait;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {WaitFor}
   */
  postDeployProvision(services) {
    let wait = new WaitFor();

    this._postDeployProvision(services);

    wait.push(() => {
      if (this._ready) {
        this._ready = false;
        return true;
      }

      return false;
    });

    return wait;
  }

  /**
   * @returns {Boolean}
   */
  get readyTeardown() {
    return this._readyTeardown;
  }

  /**
   * @returns {Boolean}
   */
  get ready() {
    return this._ready;
  }

  /**
   * @param {Object} config
   */
  injectConfig(config) {
    this._config = config;

    this._onConfigInject();
  }

  /**
   * @todo: override this
   *
   * @private
   */
  _onConfigInject() {
  }

  /**
   * @returns {Object}
   */
  config() {
    return this._config;
  }

  /**
   * @returns {Property}
   */
  get property() {
    return this.provisioning.property;
  }

  /**
   * @returns {Provisioning}
   */
  get provisioning() {
    return this._provisioning;
  }

  /**
   * @returns {String}
   */
  get appIdentifier() {
    return this.property.identifier;
  }

  /**
   * @returns {String}
   */
  get awsAccountId() {
    return this.property.config.awsAccountId;
  }

  /**
   * @returns {String}
   */
  get env() {
    return this.property.config.env;
  }

  /**
   * @param {String} service
   * @returns {Array}
   */
  getApiVersions(service) {
    try {
      return this.property.AWS[service].apiVersions.slice(); // return an array clone
    } catch (e) {
      throw new Exception(`Failed to retrieve apiVersions for "${service}" AWS service. ${e.message}`);
    }
  }

  /**
   * @param {String} microserviceIdentifier
   * @returns {String}
   */
  getUniqueHash(microserviceIdentifier = '') {
    return AbstractService.generateUniqueResourceHash(
      this.awsAccountId,
      this.appIdentifier,
      microserviceIdentifier
    );
  }

  /**
   * @param {String} awsAccountId
   * @param {String} appIdentifier
   * @param {String} microserviceIdentifier
   * @returns {String}
   */
  static generateUniqueResourceHash(awsAccountId, appIdentifier, microserviceIdentifier = '') {
    let globId = Hash.crc32(`${awsAccountId}${appIdentifier}`);

    return microserviceIdentifier ? `${Hash.loseLoseMod(microserviceIdentifier)}${globId}` : globId;
  }

  /**
   * @param {String} msIdentifier
   * @param {String} delimiter
   * @returns {String}
   */
  _getGlobalResourceMask(msIdentifier = '', delimiter = AbstractService.DELIMITER_UPPER_CASE) {
    let mask = null;
    let uniqueHash = this.getUniqueHash(msIdentifier);
    let appendMatcher = msIdentifier ? '' : '*';

    switch (delimiter) {
      case AbstractService.DELIMITER_UPPER_CASE:
        mask = AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX) +
          AbstractService.capitalizeFirst(this.env) +
          '*' +
          uniqueHash +
          appendMatcher;
        break;
      case AbstractService.DELIMITER_DOT:
        mask = `${AbstractService.AWS_RESOURCES_PREFIX}.${this.env}.*.${uniqueHash}${appendMatcher}`;
        break;
      case AbstractService.DELIMITER_UNDERSCORE:
        mask = `${AbstractService.AWS_RESOURCES_PREFIX}_${this.env}_*_${uniqueHash}${appendMatcher}`;
        break;
      case AbstractService.DELIMITER_HYPHEN_LOWER_CASE:
        let lowerAwsResourcesPrefix = AbstractService.AWS_RESOURCES_PREFIX.toLowerCase();
        let lowerEnv = this.env.toLowerCase();
        let lowerUniqueHash = uniqueHash.toLowerCase();

        mask = `${lowerAwsResourcesPrefix}-${lowerEnv}-*-${lowerUniqueHash}${appendMatcher}`;
        break;
      case AbstractService.DELIMITER_HYPHEN:
        mask = `${AbstractService.AWS_RESOURCES_PREFIX}-${this.env}-*-${uniqueHash}${appendMatcher}`;
        break;
      default:
        throw new Exception(`Undefined aws resource name delimiter ${delimiter}.`);
    }

    return mask;
  }

  /**
   * @note: Leave this method as it is for back compatibility
   *
   * @param {String} resourceName
   * @param {String} awsService
   * @param {String} msIdentifier
   * @param {String} delimiter
   * @returns {String}
   */
  generateAwsResourceName(
    resourceName, awsService, msIdentifier = '', delimiter = AbstractService.DELIMITER_UPPER_CASE
  ) {
    return AbstractService.generateAwsResourceName(
      resourceName,
      awsService,
      this.awsAccountId,
      this.appIdentifier,
      this.env,
      msIdentifier,
      delimiter
    );
  }

  /**
   * @param {String} resourceName
   * @param {String} awsService
   * @param {String} awsAccountId
   * @param {String} appIdentifier
   * @param {String} env
   * @param {String} msIdentifier
   * @param {String} delimiter
   * @returns {String}
   */
  static generateAwsResourceName(
    resourceName, awsService, awsAccountId, appIdentifier,
    env, msIdentifier = '', delimiter = AbstractService.DELIMITER_UPPER_CASE
  ) {
    let name = null;
    let uniqueHash = AbstractService.generateUniqueResourceHash(awsAccountId, appIdentifier, msIdentifier);
    let nameTplLength = (AbstractService.AWS_RESOURCES_PREFIX + env + uniqueHash).length;

    switch (delimiter) {
      case AbstractService.DELIMITER_UPPER_CASE:
        resourceName = AbstractService.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX) +
          AbstractService.capitalizeFirst(env) +
          AbstractService.capitalizeFirst(resourceName) +
          uniqueHash;

        break;
      case AbstractService.DELIMITER_DOT:
        nameTplLength += 3; // adding 3 dot delimiters
        resourceName = AbstractService.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = `${AbstractService.AWS_RESOURCES_PREFIX}.${env}.${resourceName}.${uniqueHash}`;

        break;
      case AbstractService.DELIMITER_UNDERSCORE:
        nameTplLength += 3; // adding 3 underscore delimiters
        resourceName = AbstractService.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = `${AbstractService.AWS_RESOURCES_PREFIX}_${env}_${resourceName}_${uniqueHash}`;

        break;
      case AbstractService.DELIMITER_HYPHEN_LOWER_CASE:
        nameTplLength += 3; // adding 3 hyphen delimiters
        resourceName = AbstractService.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        let lowerAwsResourcesPrefix = AbstractService.AWS_RESOURCES_PREFIX.toLowerCase();
        let lowerEnv = env.toLowerCase();
        let lowerResourceName = resourceName.toLowerCase();
        let lowerUniqueHash = uniqueHash.toLowerCase();

        name = `${lowerAwsResourcesPrefix}-${lowerEnv}-${lowerResourceName}-${lowerUniqueHash}`;

        break;
      case AbstractService.DELIMITER_HYPHEN:
        nameTplLength += 3; // adding 3 hyphen delimiters
        resourceName = AbstractService.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = `${AbstractService.AWS_RESOURCES_PREFIX}-${env}-${resourceName}-${uniqueHash}`;

        break;
      default:
        throw new Exception(`Undefined aws resource name delimiter ${delimiter}.`);
    }

    return name;
  }

  /**
   * @param {String} resourceName
   * @returns {String}
   */
  static extractBaseHashFromResourceName(resourceName) {
    let rawRegexp = `^(?:.*\/)?${AbstractService.AWS_RESOURCES_PREFIX}.+([a-z0-9]{${AbstractService.MAIN_HASH_SIZE}})$`;
    let matches = resourceName.match(new RegExp(rawRegexp, 'i'));

    if (!matches) {
      return null;
    }

    return matches[1];
  }

  /**
   * @param {String} resourceName
   * @returns {String}
   */
  static extractEnvFromResourceName(resourceName) {
    let rawRegexp = `^(?:.*\/)?${AbstractService.AWS_RESOURCES_PREFIX}`;
    rawRegexp += `(?:\.|_|-)?(dev|stage|test|prod).+[a-z0-9]{${AbstractService.MAIN_HASH_SIZE}}$`;

    let matches = resourceName.match(new RegExp(rawRegexp, 'i'));

    if (!matches) {
      return null;
    }

    return matches[1].toLowerCase();
  }

  /**
   * @returns {Number}
   */
  static get MAIN_HASH_SIZE() {
    return 8;
  }

  /**
   * @param {String} resourceName
   * @param {String} awsService
   * @param {Number} nameTplLength
   * @returns {*}
   */
  static sliceNameToAwsLimits(resourceName, awsService, nameTplLength) {
    let slicedName = resourceName;
    let totalLength = nameTplLength + resourceName.length;
    let awsServiceLimit = null;

    switch (awsService) {
      case Core.AWS.Service.ELASTIC_CACHE:
        awsServiceLimit = 20;
        break;

      case Core.AWS.Service.CLOUD_SEARCH:
      case Core.AWS.Service.ELASTIC_SEARCH:
        awsServiceLimit = 28;
        break;

      case Core.AWS.Service.SIMPLE_STORAGE_SERVICE:
        awsServiceLimit = 63;
        break;

      case Core.AWS.Service.LAMBDA:
      case Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT:
        awsServiceLimit = 64;
        break;
      case Core.AWS.Service.COGNITO_IDENTITY_PROVIDER:
      case Core.AWS.Service.COGNITO_IDENTITY:
      case Core.AWS.Service.API_GATEWAY:
        awsServiceLimit = 128;
        break;

      case Core.AWS.Service.DYNAMO_DB:
        awsServiceLimit = 255;
        break;

      case Core.AWS.Service.SIMPLE_QUEUE_SERVICE:
        awsServiceLimit = 80;
        break;

      default:
        throw new Exception(`Naming limits for aws service ${awsService} are not defined.`);
    }

    if (totalLength > awsServiceLimit) {
      slicedName = resourceName.slice(0, - (totalLength - awsServiceLimit));
    }

    return slicedName;
  }

  /**
   * @todo: remove
   * @param {String} str
   * @returns {String}
   */
  static capitalizeFirst(str) {
    return Inflector.capitalizeFirst(str);
  }

  /**
   * @todo: remove
   * @param {String} str
   * @returns {String}
   */
  static lowerCaseFirst(str) {
    return Inflector.lowerCaseFirst(str);
  }
}
