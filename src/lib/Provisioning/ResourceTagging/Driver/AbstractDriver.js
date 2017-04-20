/**
 * Created by AlexanderC on 2/26/16.
 */

'use strict';

import Core from 'deep-core';
import AWS from 'aws-sdk';
import {AbstractService} from '../../Service/AbstractService';
import {Tagging} from '../Tagging';
import {AwsRequestExtend} from '../../../Helpers/AwsRequestExtend';

export class AbstractDriver extends Core.OOP.Interface {
  /**
   * @param {Property|Instance|*} property
   * @param {String|null} applicationName
   */
  constructor(property, applicationName = null) {
    super(['resourcesArns', 'region', 'name']);

    this._property = property;
    this._applicationName = applicationName;
    this._taggingService = null;
  }

  /**
   * @returns {AWS.ResourceGroupsTaggingAPI}
   */
  get taggingService() {
    if (!this._taggingService) {
      this._taggingService = new AWS.ResourceGroupsTaggingAPI({
        region: this.region(),
      });
    }

    return this._taggingService;
  }

  /**
   * @returns {String|null}
   */
  get applicationName() {
    return this._applicationName;
  }

  /**
   * @returns {Property|Instance|*}
   */
  get property() {
    return this._property;
  }

  /**
   * @returns {Provisioning|Instance|*}
   */
  get provisioning() {
    return this._property.provisioning;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let resourcesArns = this.resourcesArns();
    let tags = this.tags;

    if (resourcesArns.length === 0) {
      cb();
      return;
    }

    let resourcesChunks = this.arrayChunk(resourcesArns);

    this._tagChunks(resourcesChunks, tags)
      .then(() => {
        console.debug(`${this.name()} resources have been successfully tagged`);

        cb();
      })
      .catch(e => {
        console.warn(`Error while tagging ${this.name()} resources: ${e.toString()}`);

        cb();
      });
  }

  /**
   * @param {(String[])[]} chunks
   * @param {Object} tags
   * @returns {Promise}
   * @private
   */
  _tagChunks(chunks, tags) {
    if (chunks.length === 0) {
      return Promise.resolve();
    }

    let chunksClone = [].concat(chunks);
    let workingChunk = chunksClone.shift();
    let payload = {
      ResourceARNList: workingChunk,
      Tags: tags,
    };

    return AwsRequestExtend.retryable(this.taggingService.tagResources(payload))
      .promise()
      .then(response => {
        if (Object.keys(response.FailedResourcesMap).length > 0) {
          console.warn(`Errors while tagging ${this.name()} resources: `, response.FailedResourcesMap);
        }

        return this._tagChunks(chunksClone, tags);
      });
  }

  /**
   * @returns {{DeepApplicationId: String, DeepDeployId: String, DeepEnvironmentId: *, DeepEnvironmentName: String}[]}
   */
  get tagsPayload() {
    let payload = [];
    let tags = this.tags;

    for (let name in tags) {
      if (!tags.hasOwnProperty(name)) {
        continue;
      }

      payload.push({
        Key: name,
        Value: tags[name],
      });
    }

    return payload;
  }

  /**
   * @returns {{DeepApplicationId: String, DeepDeployId: String, DeepEnvironmentId: *, DeepEnvironmentName: String}}
   */
  get tags() {
    let payload = {};

    payload[AbstractDriver.APPLICATION_ID_KEY] = this._property.identifier;
    payload[AbstractDriver.DEPLOY_ID_KEY] = this._property.deployId;
    payload[AbstractDriver.ENVIRONMENT_ID_KEY] = this._envId;
    payload[AbstractDriver.ENVIRONMENT_NAME_KEY] = this._property.env;

    if (this.applicationName) {
      payload[AbstractDriver.APPLICATION_NAME_KEY] = this.applicationName;
    }

    return payload;
  }

  /**
   * @private
   */
  get _envId() {
    return AbstractService.generateUniqueResourceHash(
      this._property.config.awsAccountId,
      this._property.identifier
    );
  }

  /**
   * @param {Array} array
   * @param {Number} chunkSize
   * @returns {*}
   */
  arrayChunk(array, chunkSize = 20) {
    return array.reduce((chunks, item) => {
      let workingChunk;

      for (let chunk of chunks) {
        if (chunk.length < chunkSize) {
          workingChunk = chunk;
        }
      }

      if (!workingChunk) {
        workingChunk = [];
        chunks.push(workingChunk);
      }

      workingChunk.push(item);

      return chunks;
    }, []);
  }

  /**
   * @returns {String}
   */
  static get DEPLOY_ID_KEY() {
    return 'DeepDeployId';
  }


  /**
   * @returns {String}
   */
  static get APPLICATION_NAME_KEY() {
    return 'DeepApplicationName';
  }

  /**
   * @returns {String}
   */
  static get APPLICATION_ID_KEY() {
    return 'DeepApplicationId';
  }

  /**
   * @returns {String}
   */
  static get ENVIRONMENT_NAME_KEY() {
    return 'DeepEnvironmentName';
  }

  /**
   * @returns {String}
   */
  static get ENVIRONMENT_ID_KEY() {
    return 'DeepEnvironmentId';
  }

  /**
   * @returns {Number}
   */
  step() {
    return Tagging.PROVISION_STEP;
  }
}
