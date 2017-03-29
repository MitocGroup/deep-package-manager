/**
 * Created by CCristi on 3/22/17.
 */

'use strict';

import {AbstractService} from './AbstractService';
import {RecordSetNotFoundException} from '../Exception/RecordSetNotFoundException';

export class Route53Service extends AbstractService {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._route53 = null;
  }

  /**
   * @param {AWS.Route53|Object} route53
   */
  set route53(route53) {
    this._route53 = route53;
  }

  /**
   * @returns {*}
   */
  name() {
    return 'route53';
  }

  /**
   * @param {String} domainName
   * @param {String} cfDistributionHost
   * @param {Object|null} _hostedZone
   * @param {String|null} _startRecordIdentifier
   * @returns {Promise}
   */
  findRoute53RecordByCfCNameDomain(
    domainName, 
    cfDistributionHost,
    _hostedZone = null, 
    _startRecordIdentifier = null
  ) {
    return (_hostedZone
      ? Promise.resolve(_hostedZone)
      : this.findHostedZoneByDomain(domainName)
    ).then(hostedZone => {
      if (!hostedZone) {
        return null;
      }

      let payload = {
        HostedZoneId: hostedZone.Id,
      };

      if (_startRecordIdentifier) {
        payload.StartRecordIdentifier = _startRecordIdentifier;
      }

      return this._route53.listResourceRecordSets(payload).promise().then(response => {
        let recordSets = response.ResourceRecordSets;

        for (let recordSet of recordSets) {
          if (recordSet.AliasTarget && recordSet.AliasTarget.DNSName.indexOf(cfDistributionHost) !== -1) {
            return {
              HostedZone: hostedZone,
              RecordSet: recordSet,
            };
          }
        }

        return response.IsTruncated
          ? this.findRoute53RecordByCfCNameDomain(
            domainName, cfDistributionHost,
            hostedZone, response.NextRecordIdentifier
          )
          : null;
      });
    }).then(rSet => {
      if (!rSet) {
        throw new RecordSetNotFoundException(domainName, cfDistributionHost);
      }
      
      return rSet;
    });
  }

  /**
   * @param {String} domainName
   * @param {String|null} _marker
   * @returns {Promise}
   */
  findHostedZoneByDomain(domainName, _marker = null) {
    let payload = {};

    if (_marker) {
      payload.Marker = _marker;
    }

    return this._route53.listHostedZones(payload).promise().then(response => {
      let hostedZones = response.HostedZones;

      for (let hostedZone of hostedZones) {
        if (hostedZone.Name.indexOf(domainName) !== -1) {
          return hostedZone;
        }
      }

      return response.IsTruncated
        ? this.findHostedZoneByDomain(domainName, response.NextMarker)
        : null;
    });
  }

  /**
   * @param {String} hostedZoneId
   * @param {RecordSetAction[]} recordSetActions
   * @returns {Promise}
   */
  applyRecordSetActions(hostedZoneId, recordSetActions) {
    let payload = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: recordSetActions.map(
          rSetA => rSetA.extract()
        ),
      },
    };

    return this._route53.changeResourceRecordSets(payload).promise();
  }
}
