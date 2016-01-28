/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class ACMDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Function} cb
   */
  list(cb) {
    this._listCertificates(cb);
  }

  /**
   * @param {Function} cb
   * @param {String|null} nextToken
   * @private
   */
  _listCertificates(cb, nextToken = null) {
    let payload = {
      MaxItems: ACMDriver.MAX_ITEMS,
    };

    if (nextToken) {
      payload.NextToken = nextToken;
    }

    this._awsService.listCertificates(payload, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      for (let i in data.CertificateSummaryList) {
        if (!data.CertificateSummaryList.hasOwnProperty(i)) {
          continue;
        }

        let certData = data.CertificateSummaryList[i];

        let arn = certData.CertificateArn;
        let name = certData.DomainName;

        this._checkPushStack(name, arn, certData);
      }

      if (data.NextToken) {
        this._listCertificates(cb, data.NextToken);
      } else {
        cb(null);
      }
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 100;
  }
}
