/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

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

    console.info('Changing blue distribution CNAMEs to wildcarded');

    return this._changeCloudFrontCNames(percentage)
      .then(blueAliases => {
        return (this.skipDNSActions ? this._askForBlue2ndDNSRecord() : this._createBlue2ndDNSRecord(blueAliases))
          .then(() => {
            console.info('Creating 3rd cloudfront distribution for blue green traffic management');

            return this._createTrafficManagerCfDistribution();
          })
          .then(managerDistribution => {
            return Promise.all([
              cloudFrontService.waitForDistributionDeployed(blueDistribution.id),
              cloudFrontService.waitForDistributionDeployed(managerDistribution.Id),
            ]).then(() => managerDistribution);
          })
          .then(managerDistribution => {
            managerDistribution.Aliases = blueAliases;

            return cloudFrontService.changeCloudFrontCNAMEs(managerDistribution.Id, blueAliases.Items)
              .then(() => managerDistribution);
          });
      })
      .then(managerDistribution => {
        this._config.balancerDistribution = managerDistribution;

        if (this.skipDNSActions) {
          console.info(
            `NOTE: Please change your DNS provider to point at distribution ${managerDistribution.DomainName}: `,
            JSON.stringify(managerDistribution, null, '  ')
          );

          return Promise.resolve();
        }

        return this._updateBlueMainDNSRecord(managerDistribution).then(() => {
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

    return cloudFrontService.getDistributionCNAMES(blueDistribution.id)
      .then(cNames => {
        let resolver = new CNAMEResolver(cNames);

        let domain = resolver.resolveDomain();
        let domainCName = `*.${domain}`;

        if (cNames.indexOf(domainCName) !== -1) {
          throw new CNAMEAlreadyExistsException(domainCName);
        }

        return cloudFrontService.getDistributionCNAMES(greenDistribution.id);
      })
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
   * Refactor this s**tty method
   *
   * @param {Object} blueOriginalAliases
   *
   * @returns {Promise}
   * @private
   */
  _createBlue2ndDNSRecord(blueOriginalAliases) {
    let resolver = new CNAMEResolver(blueOriginalAliases.Items);
    let blueOriginalHostname = resolver.resolveHostname();
    let blueDomain = resolver.resolveDomain();
    let blueSubDomain = blueOriginalHostname.split('.').shift();
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
      let cNameCounter = 0;

      let nextCName = () => `${blueSubDomain}${++cNameCounter}.${blueDomain}`;
      let tryCreateNextRecord = () => {
        let currentCName = nextCName();
        let createAction = new RecordSetAction(recordSet).create().name(currentCName);

        if (this.askRecordChangePermissions([createAction])) {
          return route53Service.applyRecordSetActions(hostedZone.Id, [createAction])
            .then(() => {
              this.parameters.blueBase = `https://${currentCName}`;

              console.debug(`Using "${this.parameters.blueBase}" as blue environment second base`);
            })
            .catch(e => {
              if (e.code === 'InvalidChangeBatch') {
                console.warn(`"${currentCName}" is already used. Trying another CNAME for second blue record...`);

                return tryCreateNextRecord();
              }

              throw e;
            });
        }

        return Promise.resolve();
      };

      return tryCreateNextRecord();
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
   * @returns {Promise}
   * @private
   */
  _createTrafficManagerCfDistribution() {
    let cloudFrontService = this.replication.cloudFrontService;
    let blueDistribution = cloudFrontService.blueConfig();

    return cloudFrontService.cloneDistribution(blueDistribution.id, {
      Aliases: {Quantity: 0, Items: []},
      CallerReference: this._trafficManagerDistributionIdentifier,
    }).then(response => {
      let newDistribution = response.Distribution;

      return this.attachLambdaEdgeFunction(newDistribution.Id).then(() => newDistribution);
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

    let hostname = cNameResolver.resolveHostname();
    let domain = cNameResolver.resolveDomain();
    let greenBase = `https://${hostname}`;
    let blueBase = `https://www1.${domain}`; // @todo: implement a smart subdomain generation for blue environment

    console.debug(`Using "${domain}" as application domain`);
    console.debug(`Using "${greenBase}" as green environment base`);

    return {
      percentage,
      blueBase,
      greenBase,
      domain,
    };
  }
}
