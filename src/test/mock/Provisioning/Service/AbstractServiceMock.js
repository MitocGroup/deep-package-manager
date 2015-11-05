'use strict';

import {AbstractService} from '../../../../lib.compiled/Provisioning/Service/AbstractService';

/**
 * Provisioning service
 * @description implements AbstractService to test it
 */
export class AbstractServiceMock extends AbstractService {
  /**
   * @param {Instance} provisioning
   */
  constructor(provisioning) {
    super(provisioning);
  }
}
