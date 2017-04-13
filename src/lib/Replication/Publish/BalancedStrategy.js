/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import URL from 'url';
import os from 'os';
import {CloudFrontEvent} from '../Service/Helpers/CloudFrontEvent';
import {RecordSetAction} from '../Service/Helpers/RecordSetAction';
import {AbstractStrategy} from './AbstractStrategy';
import {CloudFrontService} from '../Service/CloudFrontService';
import {CNAMEResolver} from '../Service/Helpers/CNAMEResolver';
import {MissingCNAMEException} from '../Exception/MissingCNAMEException';
import {CNAMEAlreadyExistsException} from '../Exception/CNAMEAlreadyExistsException';
import {Prompt} from '../../Helpers/Terminal/Prompt';

export class BalancedStrategy extends AbstractStrategy {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._blueRoute53Record = null;
  }

  /**
   * @param {Number} percentage
   * @returns {Promise}
   */
  publish(percentage) {
    let cloudFrontService = this.replication.cloudFrontService;
    let blueDistribution = cloudFrontService.blueConfig();

    return this._changeCloudFrontCNames(percentage)
      .then(blueAliases => {
        return (this.skipDNSActions ? this._askForBlue2ndDNSRecord() : this._createBlue2ndDNSRecord())
          .then(() => cloudFrontService.waitForDistributionDeployed(blueDistribution.id))
          .then(() => this._createTrafficManagerCfDistribution(blueAliases));
      })
      .then(newDistribution => {
        this._config.balancerDistribution = newDistribution;

        if (this.skipDNSActions) {
          console.info(
            `NOTE: Please change your DNS provider to point at distribution: `,
            JSON.stringify(newDistribution, null, '  ')
          );

          return Promise.resolve();
        }

        return this._updateBlueMainDNSRecord(newDistribution).then(() => {
          console.debug('Route53 Changes have been applied. Please note that DNS changes propagates slowly.');
        });
      });
  }

  /**
   * @param {Number} percentage
   * @returns {Promise}
   */
  update(percentage) {
    this.parameters.percentage = percentage;

    // recompile lambda with new percentage
    return this.attachLambdaEdgeFunction(this.balancerDistribution.Id);
  }

  /**
   * @param {Number} percentage
   * @returns {Promise}
   */
  _changeCloudFrontCNames(percentage) {
    let cloudFrontService = this.replication.cloudFrontService;
    let blueDistribution = cloudFrontService.blueConfig();
    let greenDistribution = cloudFrontService.greenConfig();

    return cloudFrontService.getDistributionCNAMES(greenDistribution.id)
      .then(cNames => {
        this.parameters = this.buildParameters(percentage, cNames);

        let domainCName = `*.${this.parameters.domain}`;

        return cloudFrontService.changeCloudFrontCNAMEs(blueDistribution.id, [domainCName])
          .catch(e => {
            if (e.code === 'CNAMEAlreadyExists') {
              throw new CNAMEAlreadyExistsException(domainCName);
            }

            throw e;
          });
      });
  }

  /**
   * @returns {Promise}
   * @private
   */
  _createBlue2ndDNSRecord() {
    let route53Service = this.replication.route53Service;
    let blueDistribution = this.replication.cloudFrontService.blueConfig();

    return route53Service.findRoute53RecordsByCfCNameDomain(
      this.parameters.domain,
      blueDistribution.domain
    ).then(result => {
      this._blueRoute53Record = {
        HostedZone: result.HostedZone,
        RecordSet: this.resolveSuitableRecord(result.Records),
      };

      let hostedZone = this._blueRoute53Record.HostedZone;
      let recordSet = this._blueRoute53Record.RecordSet;

      let blueHostname = URL.parse(this.parameters.blueBase).hostname;
      let createAction = new RecordSetAction(recordSet).create().name(blueHostname);

      if (this.askRecordChangePermissions([createAction])) {
        return route53Service.applyRecordSetActions(hostedZone.Id, [createAction]);
      }

      return Promise.resolve();
    });
  }

  /**
   * @param {Object[]} records
   * @returns {Object}
   */
  resolveSuitableRecord(records) {
    if (records.length === 1) {
      return records[0];
    }

    let recordsObj = records.reduce((obj, record) => {
      obj[record.Name.slice(0, -1)] = record;

      return obj;
    }, {});

    let hostnameChoice = null;
    let prompt = new Prompt(
      `Multiple Route53 Records found for "${records[0].AliasTarget.DNSName}" cloudfront. ${os.EOL}` +
      `Which one you would like to use for blue green deployment? `
    );

    prompt.syncMode = true;
    prompt.readChoice(choice => {
      hostnameChoice = choice;
    }, Object.keys(recordsObj));

    return recordsObj[hostnameChoice];
  }

  /**
   * @param {Object} cNameAliases
   * @returns {Promise}
   * @private
   */
  _createTrafficManagerCfDistribution(cNameAliases) {
    let cloudFrontService = this.replication.cloudFrontService;
    let blueDistribution = cloudFrontService.blueConfig();

    return cloudFrontService.cloneDistribution(blueDistribution.id, {
      Aliases: cNameAliases,
      CallerReference: this._trafficManagerDistributionIdentifier,
    }).then(response => {
      let newDistribution = response.Distribution;

      return this.attachLambdaEdgeFunction(newDistribution.Id)
        .then(() => cloudFrontService.waitForDistributionDeployed(newDistribution.Id))
        .then(() => newDistribution);
    });
  }

  /**
   * @param {Object} cfBalancerDistribution
   * @returns {Promise}
   * @private
   */
  _updateBlueMainDNSRecord(cfBalancerDistribution) {
    let route53Service = this.replication.route53Service;
    let route53Record = this._blueRoute53Record;

    let hostedZone = route53Record.HostedZone;
    let recordSet = route53Record.RecordSet;

    let updateRecord = new RecordSetAction(recordSet).upsert().aliasTarget({
      DNSName: cfBalancerDistribution.DomainName,
      HostedZoneId: CloudFrontService.CF_HOSTED_ZONE_ID,
      EvaluateTargetHealth: false,
    });

    if (this.askRecordChangePermissions([updateRecord])) {
      return route53Service.applyRecordSetActions(hostedZone.Id, [updateRecord]);
    }

    return Promise.resolve();
  }

  /**
   * @returns {Promise}
   */
  _askForBlue2ndDNSRecord() {
    // @todo: implement
    return Promise.resolve();
  }

  /**
   * @param {String} distributionId
   * @returns {Promise}
   */
  attachLambdaEdgeFunction(distributionId) {
    let cloudFrontService = this.replication.cloudFrontService;
    let lambdaService = this.replication.lambdaService;
    let functionName = lambdaService.cloudFrontTrafficManagerFunctionName;
    let eventType = CloudFrontEvent.VIEWER_REQUEST;

    return lambdaService.compileLambdaForCloudFront(functionName, this.parameters)
      .then(() => lambdaService.addLambdaEdgeInvokePermission(functionName, distributionId))
      .then(() => {
        console.info(`Attaching "${functionName}" to ${distributionId} ${eventType} event.`);

        return cloudFrontService.attachLambdaToDistributionEvent(
          lambdaService.generateLambdaArn(functionName),
          distributionId,
          eventType
        );
      })
      .then(() => {
        console.info(`Function "${functionName} has been attached to ${distributionId} ${eventType} event.`);
      });
  }

  /**
   * @param {Object} parameters
   */
  set parameters(parameters) {
    this._config.parameters = parameters;
  }

  /**
   * @returns {Object}
   */
  get parameters() {
    return this._config.parameters;
  }

  /**
   * @returns {Object}
   */
  get balancerDistribution() {
    return this._config.balancerDistribution;
  }

  /**
   * @param {Object} balancerDistribution
   */
  set balancerDistribution(balancerDistribution) {
    this._config.balancerDistribution = balancerDistribution;
  }

  /**
   * @returns {String}
   */
  get _trafficManagerDistributionIdentifier() {
    return `deep.blue-green-distribution.${this.replication.hashCode}`;
  }

  /**
   * @todo: inject those variables into publish strategy
   *
   * @param {Number} percentage
   * @param {String[]} cNames
   * @returns {Object}
   */
  buildParameters(percentage, cNames) {
    if (cNames.length === 0) {
      throw new MissingCNAMEException();
    }

    let cNameResolver = new CNAMEResolver(cNames);

    let hostname = new CNAMEResolver(cNames).resolveHostname();
    let domain = cNameResolver.resolveDomain();
    let greenBase = `https://${hostname}`;
    let blueBase = `https://www1.${domain}`; // @todo: implement a smart subdomain generation for blue environment

    console.debug(`Using "${domain}" as application domain`);
    console.debug(`Using "${greenBase}" as green environment base`);
    console.debug(`Using "${blueBase}" as blue environment new base`);

    return {
      percentage,
      blueBase,
      greenBase,
      domain,
    };
  }
}
