/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {IAMDriver as IAMListingDriver} from '../ListingDriver/IAMDriver';
import {AwsRequestSyncStack} from '../../Helpers/AwsRequestSyncStack';
import {IAMService} from '../Service/IAMService';

export class IAMDriver extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  service() {
    return 'IAM';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    if (IAMListingDriver.isOIDCProvider(resourceId)) {
      this._deleteOIDCProvider(resourceId, resourceData, cb);
    } else {
      this._removeRoleChain(resourceId, cb);
    }
  }

  /**
   * @param {String} roleName
   * @param {Function} cb
   * @private
   */
  _removeRoleChain(roleName, cb) {
    this._awsService.listAttachedRolePolicies({
      RoleName: roleName,
      MaxItems: IAMDriver.MAX_ITEMS,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      if (data.AttachedPolicies.length <= 0) {
        this._deleteIAMRole(roleName, cb);
      } else {
        let awsStack = new AwsRequestSyncStack();

        for (let i in data.AttachedPolicies) {
          if (!data.AttachedPolicies.hasOwnProperty(i)) {
            continue;
          }

          let policyData = data.AttachedPolicies[i];
          let policyArn = policyData.PolicyArn;

          awsStack.push(this._awsService.detachRolePolicy({
            PolicyArn: policyArn,
            RoleName: roleName,
          }), (error) => {
            if (error) {
              this._logError(error);
            }
          });

          // @todo: do not try to delete foreign policies...
          this._awsService.deletePolicy({
            PolicyArn: policyArn,
          }, (error) => {
            if (error) {
              this._logError(error);
            }
          });
        }

        awsStack.join().ready(() => {
          this._deleteIAMRole(roleName, cb);
        });
      }
    });
  }

  /**
   * @param {String} roleName
   * @param {Function} cb
   * @private
   */
  _deleteIAMRole(roleName, cb) {
    this._awsService.deleteRole({
      RoleName: roleName,
    }, (error) => {
      if (error) {
        // role was not found into this region
        if (error.code === 'NoSuchEntity') {
          cb(null);
          return;
        }

        // remove inline policies...
        if (error.code === 'DeleteConflict') {
          this._awsService.listRolePolicies({
            RoleName: roleName,
            MaxItems: IAMDriver.MAX_ITEMS,
          }, (error, data) => {
            if (error) {
              cb(error);
              return;
            }

            let awsStack = new AwsRequestSyncStack();

            for (let i in data.PolicyNames) {
              if (!data.PolicyNames.hasOwnProperty(i)) {
                continue;
              }

              let inlinePolicyName = data.PolicyNames[i];

              awsStack.push(this._awsService.deleteRolePolicy({
                RoleName: roleName,
                PolicyName: inlinePolicyName,
              }), (error) => {
                if (error) {
                  cb(error.code === 'NoSuchEntity' ? null : error);
                }
              });
            }

            awsStack.join().ready(() => {
              this._deleteIAMRole(roleName, cb);
            });
          });

          return;
        }

        cb(error);

        return;
      }

      cb(null);
    });
  }

  /**
   * @param {String} providerArn
   * @param {Object} providerData
   * @param {Function} cb
   * @private
   */
  _deleteOIDCProvider(providerArn, providerData, cb) {
    let deepFakeAudiences = [];
    let thisAppFakeAudience = IAMService.getDeepAppOIDCAudience(this.baseHash);

    providerData.ClientIDList.forEach((clientId) => {
      if (IAMService.isFakeOIDCProviderAudience(clientId)) {
        deepFakeAudiences.push(clientId);
      }
    });

    if (deepFakeAudiences.indexOf(thisAppFakeAudience) !== -1) {
      let params = {
        OpenIDConnectProviderArn: providerArn,
      };

      if (deepFakeAudiences.length === 1) {
        // delete OIDC provider if it contains only this app fake audience
        this._awsService.deleteOpenIDConnectProvider(params, (error) => {
          cb(error || null);
        });
      } else {
        params.ClientID = thisAppFakeAudience;
        // remove only this app audience because this OIDC provider is used by other apps
        this._awsService.removeClientIDFromOpenIDConnectProvider(params, (error) => {
          cb(error || null);
        });
      }
    } else {
      cb(null);
    }
  }

  /**
   * @returns {Number}
   */
  static get MAX_ITEMS() {
    return 1000;
  }
}
