'use strict';

import DeepFramework from 'deep-framework';

/**
 * Sample lambda runtime
 */
export default class extends DeepFramework.Core.AWS.Lambda.Runtime {
  /**
   * @param {Array} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * Handle lambda execution
   */
  handle(request) {
    this.createResponse(request).send();
  }
}
