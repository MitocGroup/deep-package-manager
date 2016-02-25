/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import tagSchema from './tag.schema';
import {InvalidTagMetadataException} from './Exception/InvalidTagMetadataException';
import Joi from 'joi';

export class TagMetadata {
  /**
   * @param {Object} tagMetadata
   */
  constructor(tagMetadata) {
    this._tagMetadata = tagMetadata;

    this._parsedTagMetadata = Joi.validate(tagMetadata, tagSchema);
  }

  /**
   * @returns {Object}
   */
  get rawMetadata() {
    return this._tagMetadata;
  }

  /**
   * @returns {Boolean}
   */
  get valid() {
    return !this.error;
  }

  /**
   * @returns {String}
   */
  get error() {
    return this._parsedTagMetadata.error;
  }

  /**
   * @returns {Object}
   */
  extract() {
    if (!this.valid) {
      throw new InvalidTagMetadataException(this.error);
    }

    return this._parsedTagMetadata.value;
  }
}
