/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import {AbstractService} from './AbstractService';
import Core from 'deep-core';


/**
 * Kinesis service
 */
export class KinesisService extends AbstractService {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @returns {String}
   */
  name() {
    return Core.AWS.Service.KINESIS;
  }

  /**
   * @returns {String[]}
   */
  static get AVAILABLE_REGIONS() {
    return [
      Core.AWS.Region.AP_NORTHEAST_TOKYO,
      Core.AWS.Region.AP_NORTHEAST_SEOUL,
      Core.AWS.Region.AP_SOUTHEAST_SYDNEY,
      Core.AWS.Region.AP_SOUTHEAST_SINGAPORE,
      Core.AWS.Region.AP_SOUTH_MUMBAI,
      Core.AWS.Region.EU_CENTRAL_FRANKFURT,
      Core.AWS.Region.EU_WEST_IRELAND,
      Core.AWS.Region.EU_WEST_LONDON,
      Core.AWS.Region.SA_EAST_SAO_PAULO,
      Core.AWS.Region.CA_CENTRAL_MONTREAL,
      Core.AWS.Region.US_EAST_VIRGINIA,
      Core.AWS.Region.US_EAST_OHIO,
      Core.AWS.Region.US_WEST_CALIFORNIA,
      Core.AWS.Region.US_WEST_OREGON,
    ];
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {KinesisService}
   * @private
   */
  _setup(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {KinesisService}
   * @private
   */
  _postProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._readyTeardown = true;
      return this;
    }

    this._readyTeardown = true;

    return this;
  }

  /**
   * @param {Core.Generic.ObjectStorage} services
   * @returns {KinesisService}
   * @private
   */
  _postDeployProvision(services) {
    // @todo: implement!
    if (this._isUpdate) {
      this._ready = true;
      return this;
    }

    this._ready = true;

    return this;
  }
}
