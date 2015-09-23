/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import Core from '@mitocgroup/deep-core';
import {WaitFor} from '../../Helpers/WaitFor';
import {Hash} from '../../Helpers/Hash';
import {Exception} from '../../Exception/Exception';

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
   * @param {Core.Generic.ObjectStorage} services
   */
  setup(services) {
    let wait = new WaitFor();

    this._setup(services);

    wait.push(function() {
      if (this._ready) {
        this._ready = false;
        return true;
      }

      return false;
    }.bind(this));

    return wait;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   */
  postProvision(services) {
    let wait = new WaitFor();

    this._postProvision(services);

    wait.push(function() {
      if (this._readyTeardown) {
        this._readyTeardown = false;
        return true;
      }

      return false;
    }.bind(this));

    return wait;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   */
  postDeployProvision(services) {
    let wait = new WaitFor();

    this._postDeployProvision(services);

    wait.push(function() {
      if (this._ready) {
        this._ready = false;
        return true;
      }

      return false;
    }.bind(this));

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
   * @param {String} microserviceIdentifier
   * @returns {String}
   */
  getUniqueHash(microserviceIdentifier = '') {
    return Hash.crc32(this.awsAccountId + microserviceIdentifier + this.appIdentifier);
  }

  /**
   * @param {String} resourceName
   * @param {String} awsService
   * @param {String} msIdentifier
   * @param {String} delimiter
   * @returns {String}
   */
  generateAwsResourceName(resourceName, awsService, msIdentifier = '', delimiter = AbstractService.DELIMITER_UPPER_CASE) {
    let name = null;
    let uniqueHash = this.getUniqueHash(msIdentifier);
    let nameTplLength = (AbstractService.AWS_RESOURCES_PREFIX + this.env + uniqueHash).length;

    switch (delimiter) {
      case AbstractService.DELIMITER_UPPER_CASE:
        resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX) +
          AbstractService.capitalizeFirst(this.env) +
          AbstractService.capitalizeFirst(resourceName) +
          uniqueHash;

        break;
      case AbstractService.DELIMITER_DOT:
        nameTplLength += 3; // adding 3 dot delimiters
        resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = `${AbstractService.AWS_RESOURCES_PREFIX}.${this.env}.${resourceName}.${uniqueHash}`;

        break;
      case AbstractService.DELIMITER_UNDERSCORE:
        nameTplLength += 3; // adding 3 underscore delimiters
        resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

        name = `${AbstractService.AWS_RESOURCES_PREFIX}_${this.env}_${resourceName}_${uniqueHash}`;

        break;
      default:
        throw new Exception(`Undefined aws resource name delimiter ${delimiter}.`);
    }

    return name;
  }

  /**
   * @param {String} resourceName
   * @param {String} awsService
   * @param {Integer} nameTplLength
   */
  sliceNameToAwsLimits(resourceName, awsService, nameTplLength) {
    let slicedName = resourceName;
    let totalLength = nameTplLength + resourceName.length;
    let awsServiceLimit = null;

    switch (awsService) {
      case Core.AWS.Service.SIMPLE_STORAGE_SERVICE:
        awsServiceLimit = 63;
        break;

      case Core.AWS.Service.LAMBDA:
      case Core.AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT:
        awsServiceLimit = 64;
        break;

      case Core.AWS.Service.COGNITO_IDENTITY:
      case Core.AWS.Service.API_GATEWAY:
        awsServiceLimit = 128;
        break;

      case Core.AWS.Service.DYNAMO_DB:
        awsServiceLimit = 255;
        break;

      default:
        throw new Exception(`Naming limits for aws service ${awsService} are not defined.`);
    }

    if (totalLength > awsServiceLimit) {
      slicedName = resourceName.slice(0, -(totalLength - awsServiceLimit));
    }

    return slicedName;
  }

  /**
   * @param {String} str
   * @returns {String}
   */
  static capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
