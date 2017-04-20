/**
 * Created by CCristi on 4/19/17.
 */

'use strict';

import Core from 'deep-core';
import {AbstractDriver} from './AbstractDriver';
import {LambdaService} from '../../Service/LambdaService';
import {Tagging} from '../Tagging';
import {AwsRequestExtend} from '../../../Helpers/AwsRequestExtend';

export class LambdaDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._lambda = this.provisioning.lambda;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let lambdasArns = this.resourcesArns();
    let tags = this.tags;

    if (lambdasArns.length === 0) {
      cb();
      return;
    }

    let lambdaChunks = this.arrayChunk(lambdasArns, LambdaDriver.TAG_CHUNK_SIZE);

    this._tagChunks(lambdaChunks, tags)
      .then(() => {
        console.debug(`Lambda resources have been successfully tagged`);

        cb();
      })
      .catch(e => {
        console.warn(`Error while tagging lambda resources: ${e.toString()}`);
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

    let promises = workingChunk.map(lambdaArn => {
      return AwsRequestExtend.retryable(
        this._lambda.tagResource({
          Resource: lambdaArn,
          Tags: tags,
        })
      ).promise().catch(e => {
        console.warn(`Error while tagging "${lambdaArn}": ${e.toString()}`);

        return Promise.resolve();
      });
    });

    return Promise.all(promises).then(() => {
      return this._tagChunks(chunksClone, tags);
    });
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.LAMBDA;
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.lambda.config.region;
  }

  /**
   * @returns {String[]}
   */
  resourcesArns() {
    let lambdaArns = [];
    let lambdaService = this.provisioning.services.find(LambdaService);
    let lambdasObj = lambdaService.config().names;

    for (let msName in lambdasObj) {
      if (!lambdasObj.hasOwnProperty(msName)) {
        continue;
      }

      for (let actionName in lambdasObj[msName]) {
        if (!lambdasObj[msName].hasOwnProperty(actionName)) {
          continue;
        }

        let lambdaArn = lambdaService._generateLambdaArn(lambdasObj[msName][actionName]);

        lambdaArns.push(lambdaArn);
      }
    }

    return lambdaArns;
  }

  /**
   * @returns {Number}
   */
  static get TAG_CHUNK_SIZE() {
    return 5;
  }

  /**
   * @returns {Number}
   */
  step() {
    return Tagging.POST_DEPLOY_STEP;
  }
}
