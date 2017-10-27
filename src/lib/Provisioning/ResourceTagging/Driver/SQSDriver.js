'use strict';

import { AbstractDriver } from './AbstractDriver';
import Core from 'deep-core';

export class SQSDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._sqs = this.provisioning.sqs;
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.sqs.config.region;
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.SIMPLE_QUEUE_SERVICE;
  }

  /**
   * @returns {String[]}
   */
  resourcesArns() {
    let queueUrls = [];
    let sqsQueues = this.provisioning.config[this.name()].queues;

    for (let dbolName in sqsQueues) {
      if (sqsQueues.hasOwnProperty(dbolName)) {
        queueUrls.push(sqsQueues[dbolName]['url']);
      }
    }

    return queueUrls;
  }

  /**
   * @param {Function} cb
   */
  tag(cb) {
    let queueUrls = this.resourcesArns();
    if (queueUrls.length === 0) {
      cb();
      return;
    }

    let promises = queueUrls.map(url => {
      return this._sqs.tagQueue({
        QueueUrl: url,
        Tags: this.tags
      }).promise();
    });

    Promise.all(promises).then(res => {
      console.debug('SQS resources have been successfully tagged');
      cb();
    }).catch(err => {
      console.warn('Error while tagging QSQ resources: ', err);
      cb();
    });
  }
}
