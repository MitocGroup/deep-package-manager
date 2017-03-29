/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import os from 'os';
import {AbstractStrategy} from './AbstractStrategy';
import {CNAMEResolver} from '../Service/Helpers/CNAMEResolver';
import {RecordSetAction} from '../Service/Helpers/RecordSetAction';
import {RecordSetNotFoundException} from '../Exception/RecordSetNotFoundException';
import {BadRecordSetsException} from '../Exception/BadRecordSetsException';
import {Prompt} from '../../Helpers/Terminal/Prompt';

export class CompleteStrategy extends AbstractStrategy {
  /**
   * @param {Object} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {Promise}
   */
  publish() {
    let route53Service = this.replication.route53Service;
    let cloudFrontService = this.replication.cloudFrontService;

    let cloudFrontBlueCfg = cloudFrontService.blueConfig();
    let cloudFrontGreenCfg = cloudFrontService.greenConfig();

    return cloudFrontService.getDistributionCNAMES(cloudFrontBlueCfg.id).then(cNames => {
      let cfCNameDomain = new CNAMEResolver(cNames).resolveDomain();

      return Promise.all([
        route53Service.findRoute53RecordByCfCNameDomain(cfCNameDomain, cloudFrontBlueCfg.domain),
        route53Service.findRoute53RecordByCfCNameDomain(cfCNameDomain, cloudFrontGreenCfg.domain),
      ]);
    }).then(records => this._hotSwapRoute53Records(records[0], records[1]))
      .catch(e => {
        if (e instanceof RecordSetNotFoundException) {
          console.warn(`No Route53 RecordSet found matching "${e.targetHostname}" hostname`);
          console.warn(`Please change your dns record and rerun this command with --skip-route53 flag`)
        }

        throw e;
      })
      .then(() => this.replication.detachCloudFrontLambdaAssociations())
      .then(() => this._hotSwapCloudFrontCNames());
  }

  /**
   * @returns {Promise}
   */
  _hotSwapCloudFrontCNames() {
    if (this._askCloudFrontChangePermissions()) {
      return this.replication.cloudFrontService
        .hotSwapCloudFrontCNames()
        .then(() => {
          console.info('CloudFront CNAMEs have been swapped.')
        });
    }

    return Promise.resolve({});
  }

  /**
   * @param {Object} blueRecord
   * @param {Object} greenRecord
   * @returns {Promise}
   * @private
   */
  _hotSwapRoute53Records(blueRecord, greenRecord) {
    let route53Service = this.replication.route53Service;

    let hostedZoneId = blueRecord.HostedZone.Id;

    if (hostedZoneId !== greenRecord.HostedZone.Id) {
      return Promise.reject(new BadRecordSetsException('BlueGreen RecordSets must be in same hosted zone'));
    }

    let blueRecordSet = blueRecord.RecordSet;
    let greenRecordSet = greenRecord.RecordSet;

    if (blueRecordSet.AliasTarget.DNSName === greenRecordSet.AliasTarget.DNSName) {
      return Promise.reject(new BadRecordSetsException('RecordSets must have different aliases'));
    }

    let recordActions = [
      new RecordSetAction(greenRecordSet).aliasTarget(blueRecordSet.AliasTarget).upsert(),
      new RecordSetAction(blueRecordSet).aliasTarget(greenRecordSet.AliasTarget).upsert(),
    ];

    if (this._askRecordChangePermissions(recordActions)) {
      return route53Service
        .applyRecordSetActions(hostedZoneId, recordActions)
        .then(() => {
          console.info('RecordSet actions have been applied. Please note that DNS changes are propagated slowly');
        });
    }

    return Promise.resolve({});
  }

  /**
   * @returns {Boolean}
   * @private
   */
  _askCloudFrontChangePermissions() {
    let cloudFrontService = this.replication.cloudFrontService;
    let promptQuestion = [
      `CloudFront ${cloudFrontService.blueConfig().domain} aliases are going to be` +
      ` swapped with ${cloudFrontService.greenConfig().domain} aliases`,
      'Please confirm those changes'
    ].join(os.EOL);

    let prompt = new Prompt(promptQuestion);
    let confirmBool = null;

    prompt.syncMode = true;
    prompt.readConfirm(confirm => {
      confirmBool = confirm;
    });

    return confirmBool;
  }

  /**
   * @param {RecordSetAction[]} recordSetActions
   * @returns {Boolean}
   * @private
   */
  _askRecordChangePermissions(recordSetActions) {
    let promptQuestion = ['Following Route53 actions are going to be executed: ',]
      .concat(recordSetActions.map(rSetA => rSetA.toString()))
      .concat('Please confirm those changes')
      .join(os.EOL);

    let prompt = new Prompt(promptQuestion);
    let confirmBool = null;

    prompt.syncMode = true;
    prompt.readConfirm(confirm => {
      confirmBool = confirm;
    });

    return confirmBool;
  }
}
