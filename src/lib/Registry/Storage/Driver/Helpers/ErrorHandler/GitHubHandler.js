/**
 * Created by CCristi on 7/11/16.
 */

'use strict';

import {GitHubApiRateExceededException} from './Exception/GitHubRateExceededException';
import {AbstractHandler} from './AbstractHandler';

export class GitHubHandler extends AbstractHandler {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {Object} error
   * @returns {Object}
   * @private
   */
  mapError(error) {
    let errorHeaders = error.response.headers;

    if (
      errorHeaders.hasOwnProperty('x-ratelimit-remaining') &&
      parseInt(errorHeaders['x-ratelimit-remaining']) === 0
    ) {
      return new GitHubApiRateExceededException();
    }

    return error;
  }
}
