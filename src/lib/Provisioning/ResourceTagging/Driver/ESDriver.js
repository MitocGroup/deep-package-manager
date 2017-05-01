/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/16/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver.js';
import Core from 'deep-core';

/**
 * Elasticsearch Tag Driver
 */
export class ESDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.ELASTIC_SEARCH;
  }

  /**
   * @returns {String}
   */
  region() {
    return this.provisioning.elasticSearch.config.region;
  }

  /**
   * @returns {String[]}
   */
  resourcesArns() {
    return this.domainList.map(domain => domain.ARN);
  }

  /**
   * @returns {Object[]}
   */
  get domainList() {
    let domainList = [];
    let provision = this.provisioning.config.es.domains;

    for (let name in provision) {
      if (!provision.hasOwnProperty(name)) {
        continue;
      }

      domainList.push(provision[name]);
    }

    return domainList;
  }
}
