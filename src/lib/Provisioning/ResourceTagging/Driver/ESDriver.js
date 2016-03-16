/**
 * Created by CCristi <ccovali@mitocgroup.com> on 3/16/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver.js';
import {AwsRequestSyncStack} from '../../../Helpers/AwsRequestSyncStack';

/**
 * Elasticsearch Tag Driver
 */
export class ESDriver extends AbstractDriver {
  constructor(...args) {
    super(...args);

    this._elasticSearch = this.provisioning.elasticSearch;
  }

  tag(callback) {
    let stack = new AwsRequestSyncStack();
    let tagsPayload = this.tagsPayload;

    this.domainList.forEach((domain) => {
      let payload = {
        ARN: domain.ARN,
        TagList: tagsPayload
      };

      stack.push(this._elasticSearch.addTags(payload), (error) => {
        console.log(error ?
            `Error on tagging Elasticsearch domain ${domain.DomainName}` :
            `Elasticsearch domain ${domain.DomainName} has been tagged`
        );
      });
    });

    stack.join().ready(callback);
  }

  /**
   * @returns {Array}
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
