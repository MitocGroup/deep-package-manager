'use strict';
import {Uploader} from '../../../lib/Dependencies/Uploader';

/**
 * Dependencies uploader
 */
export class UploaderMock extends Uploader {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    super(driver);
  }

  /**
   * @param {Microservice} microservice
   * @param {Function} callback
   */
  dispatch(microservice, callback) {
    callback(null, 'data');
    return;
  }
}