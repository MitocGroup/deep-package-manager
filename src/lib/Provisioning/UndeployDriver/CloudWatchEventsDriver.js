/**
 * Created by AlexanderC on 11/24/15.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class CloudWatchEventsDriver extends AbstractDriver {
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
    return 'CloudWatchEvents';
  }

  /**
   * @param {String} resourceId
   * @param {Object} resourceData
   * @param {Function} cb
   * @private
   */
  _removeResource(resourceId, resourceData, cb) {
    this._removeTargets(resourceId, (error) => {
      if (error) {
        cb(error);
        return;
      }

      this._deleteRule(resourceId, cb);
    });
  }

  /**
   * @param {String} ruleName
   * @param {Function} cb
   * @param {Number} retries
   * @private
   */
  _deleteRule(ruleName, cb, retries = 0) {
    this._awsService.deleteRule({
      Name: ruleName,
    }, (error) => {
      if (error) {
        if (retries >= CloudWatchEventsDriver.MAX_ON_CONFLICT_RETRIES) {
          cb(error);
        } else { // @todo: remove hook when fixed

          // Fix:
          //      OperationAbortedException: A conflicting operation is currently
          //      in progress against this resource. Please try again.
          setTimeout(() => {
            this._deleteRule(ruleName, cb, retries++);
          }, 300);
        }

        return;
      }

      cb(null);
    });
  }

  /**
   * @param {String} ruleName
   * @param {Function} cb
   * @private
   */
  _removeTargets(ruleName, cb) {
    this._awsService.listTargetsByRule({
      Rule: ruleName,
    }, (error, data) => {
      if (error) {
        cb(error);
        return;
      }

      let targets = data.Targets;

      if (targets.length <= 0) {
        cb();
        return;
      }

      let ids = [];

      targets.forEach((targetData) => {
        ids.push(targetData.Id);
      });

      let payload = {
        Rule: ruleName,
        Ids: ids,
      };

      this._awsService.removeTargets(payload, (error) => {
        cb(error);
      });
    });
  }

  /**
   * @returns {Number}
   */
  static get MAX_ON_CONFLICT_RETRIES() {
    return 10;
  }
}
