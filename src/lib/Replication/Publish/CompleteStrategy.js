/**
 * Created by CCristi on 3/27/17.
 */

'use strict';

import URL from 'url';
import {BalancedStrategy} from './BalancedStrategy';
import {CNAMEResolver} from '../Service/Helpers/CNAMEResolver';
import {RecordSetAction} from '../Service/Helpers/RecordSetAction';
import {RecordSetNotFoundException} from '../Exception/RecordSetNotFoundException';
import {CloudFrontService} from '../Service/CloudFrontService';
import {CloudFrontEvent} from '../Service/Helpers/CloudFrontEvent';

export class CompleteStrategy extends BalancedStrategy {
  /**
   * @param {Object} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * 1. Change blue distribution to use wildcard CNAME (Wait until deployed)
   * 2. Change green distribution to use the blue ones (Wait until deployed)
   * 3. Change blue route53 record to point at green distribution
   *
   * @returns {Promise}
   */
  publish(percentage) {
    let cloudFrontService = this.replication.cloudFront;
    let blueDistribution = cloudFrontService.blueConfig();
    let greenDistribution = cloudFrontService.greenConfig();

    return this._changeCloudFrontCNames(percentage)
      .then(blueAliases => {
        let blueCNames = blueAliases.Items;

        return cloudFrontService.waitForDistributionDeployed(blueDistribution.id)
          .then(() => {
            return cloudFrontService.changeCloudFrontCNAMEs(greenDistribution.id, blueCNames);
          });
      })
      .then(() => {
        return cloudFrontService.waitForDistributionDeployed(greenDistribution.id);
      })
      .then(() => {
        if (this.skipDNSActions) {
          return Promise.resolve();
        }

        return this._changeCloudFrontRoute53Records(
          this.parameters.domain,
          [blueDistribution.domain,]
        );
      });
  }

  /**
   * 1. Use fixed CNAME (www1.deep.mg) for blue distribution (Wait until deployed) (ex: www1.deep.mg)
   * 2. Change balancer cloudfront distribution to use wildcard CNAME (*.deep.mg) (Wait until deployed)
   * 3. Change green cloudfront distribution to use original blues CNAMEs (www.deep.mg) (Wait until deployed)
   * 4. Change route53 record for original (www.deep.mg) record to point at green distribution
   * 5. @todo: implement cleanup parameter which would delete the 3rd balancer distribution and its route53 record
   *
   * @returns {Promise}
   */
  update(percentage = 100) {
    let cloudFrontService = this.replication.cloudFrontService;
    let balancerDistribution = this.balancerDistribution;
    let parameters = this._config.parameters;

    let cNames = balancerDistribution.DistributionConfig.Aliases.Items;
    let appDomain = new CNAMEResolver(cNames).resolveDomain();
    let balancerDomain = balancerDistribution.DomainName;
    let blueDistribution = cloudFrontService.blueConfig();
    let greenDistribution = cloudFrontService.greenConfig();
    let blueDistributionCNames = [URL.parse(parameters.blueBase).hostname,];

    console.info(`Changing "${blueDistribution.id}" distribution CNAMES to [${blueDistributionCNames.join(',')}]`);

    return cloudFrontService.changeCloudFrontCNAMEs(blueDistribution.id, blueDistributionCNames)
      // oldAliases should be the wildcard one
      .then(oldAliases => {
        let blueCNames = oldAliases.Items;

        return cloudFrontService.waitForDistributionDeployed(blueDistribution.id).then(() => {
          console.info(`Changing "${balancerDistribution.Id}" distribution CNAMES to [${blueCNames.join(',')}]`);

          return cloudFrontService.changeCloudFrontCNAMEs(balancerDistribution.Id, blueCNames);
        });
      })
      .then(() => cloudFrontService.waitForDistributionDeployed(balancerDistribution.Id))
      .then(() => {
        let originalBlueCNames = balancerDistribution.DistributionConfig.Aliases.Items;

        console.info(`Changing "${greenDistribution.id}" distribution CNAMES to [${originalBlueCNames.join(',')}]`);

        return cloudFrontService.changeCloudFrontCNAMEs(greenDistribution.id, originalBlueCNames);
      })
      .then(() => cloudFrontService.waitForDistributionDeployed(greenDistribution.id))
      .then(() => this._changeCloudFrontRoute53Records(appDomain, [balancerDomain,]))
      .then(() => {
        return cloudFrontService.detachEventsFromDistribution(
          [CloudFrontEvent.VIEWER_REQUEST],
          balancerDistribution.Id
        );
      })
      .then(() => {
        console.info('Route53 changes have been applied. Please note that DNS changes propagates slowly');
      });
  }

  /**
   * Change route53 record to point at green distribution
   *
   * @param {String} domainName
   * @param {String[]} cloudFrontDomains
   * @returns {Promise}
   * @private
   */
  _changeCloudFrontRoute53Records(domainName, cloudFrontDomains) {
    let cloudFrontService = this.replication.cloudFrontService;
    let route53Service = this.replication.route53Service;
    let greenDistribution = cloudFrontService.greenConfig();

    let updatePromises = cloudFrontDomains.map(cloudFrontDomain => {
      return route53Service.findRoute53RecordByCfCNameDomain(domainName, cloudFrontDomain)
        .then(route53Record => {
          let hostedZone = route53Record.HostedZone;
          let updateAction = new RecordSetAction(route53Record.RecordSet).upsert().aliasTarget({
            DNSName: greenDistribution.domain,
            EvaluateTargetHealth: false,
            HostedZoneId: CloudFrontService.CF_HOSTED_ZONE_ID,
          });

          if (this.askRecordChangePermissions([updateAction,])) {
            return route53Service.applyRecordSetActions(hostedZone.Id, [updateAction,]);
          }

          return Promise.resolve();
        })
        .catch(e => {
          if (e instanceof RecordSetNotFoundException) {
            console.warn(e.toString());
            console.warn(`Please change your DNS record for "${e.targetHostname}" to point at "${greenDistribution.domain}"`);

            return Promise.resolve();
          }
        });
    });

    return Promise.all(updatePromises);
  }
}
