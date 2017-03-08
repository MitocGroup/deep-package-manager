/**
 * Created by CCristi on 3/6/17.
 */

'use strict';

export class CloudFrontEvent {
  /**
   * @returns {String}
   */
  static get VIEWER_REQUEST() {
    return 'viewer-request';
  }

  /**
   * @returns {String}
   */
  static get VIEWER_RESPONSE() {
    return 'viewer-response';
  }

  /**
   * @returns {String}
   */
  static get ORIGIN_REQUEST() {
    return 'origin-request';
  }

  /**
   * @returns {String}
   */
  static get ORIGIN_RESPONSE() {
    return 'origin-response';
  }

  /**
   * @param {String} eventType
   * @returns {Boolean}
   */
  static exists(eventType) {
    return [
      CloudFrontEvent.VIEWER_REQUEST,
      CloudFrontEvent.VIEWER_RESPONSE,
      CloudFrontEvent.ORIGIN_REQUEST,
      CloudFrontEvent.ORIGIN_RESPONSE,
    ].indexOf(eventType) !== -1;
  } 
}
