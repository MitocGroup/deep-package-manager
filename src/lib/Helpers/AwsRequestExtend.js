'use strict';

export class AwsRequestExtend {
  /**
   * @param {AWS.Request|Object} request
   * @param {String[]} retryableCodes
   * @param {Number} delay
   * @returns {AWS.Request|Object}
   */
  static retryable(
    request,
    retryableCodes = AwsRequestExtend.DEFAULT_RETRYABLE_CODES,
    delay = AwsRequestExtend.DEFAULT_DELAY
  ) {
    request.on('retry', response => {
      if (retryableCodes.indexOf(response.error.code) !== -1) {
        response.error.retryable = true;
        response.error.retryDelay = delay;
      }
    });

    return request;
  }

  /**
   * @returns {String[]}
   */
  static get DEFAULT_RETRYABLE_CODES() {
    return [
      'ResourceInUseException',
      'Throttling',
      'ThrottledException',
      'ThrottlingException',
      'InternalServiceException'
    ];
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_DELAY() {
    return 500;
  }
}
