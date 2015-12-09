'use strict';

import {Instance} from '../../../../node_modules/deep-db/node_modules/deep-kernel/lib.compiled/Microservice/Instance';

/**
 * Microservice mock class
 */
export class InstanceMock extends Instance {
  /**
   * @param {String} identifier
   * @param {Object} rawResources
   */
  constructor(identifier, rawResources) {
    super(identifier, rawResources);
  }
}
