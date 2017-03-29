/**
 * Created by CCristi on 2/13/17.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class RecordSetNotFoundException extends Exception {
  /**
   * @param {String} domainName
   * @param {String} hostname
   */
  constructor(domainName, hostname) {
    super(`RecordSet not found matching "${domainName}" domain and "${hostname}" host.`);

    this._targetHostname = hostname;
  }

  /**
   * @returns {String|*}
   */
  get targetHostname() {
    return this._targetHostname;
  }
}
