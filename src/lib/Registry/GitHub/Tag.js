/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {TagMetadata} from './TagMetadata';

export class Tag {
  /**
   * @param {String} repository
   * @param {String} name
   * @param {String} sourceUrl
   */
  constructor(repository, name, sourceUrl) {
    this._repository = repository;
    this._name = name;
    this._sourceUrl = sourceUrl;
  }

  /**
   * @param {String} repository
   * @param {Object[]} tagMetadataVector
   * @param {Boolean} failSilently
   * @returns {Array}
   */
  static createFromMetadataVector(repository, tagMetadataVector, failSilently = true) {
    let tags = [];

    for (let tagMetadata in tagMetadataVector) {
      if (!tagMetadataVector.hasOwnProperty(tagMetadata)) {
        continue;
      }

      try {
        tags.push(Tag.createFromRawMetadata(repository, tagMetadataVector[tagMetadata]));
      } catch (error) {
        if (!failSilently) {
          throw error;
        }
      }
    }

    return tags;
  }

  /**
   * @param {String} repository
   * @param {Object} rawTagMetadata
   * @returns {Tag}
   */
  static createFromRawMetadata(repository, rawTagMetadata) {
    let metadata = (new TagMetadata(rawTagMetadata)).extract();

    return new Tag(repository, metadata.name, metadata.tarball_url);
  }

  /**
   * @returns {String}
   */
  get repository() {
    return this._repository;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get sourceUrl() {
    return this._sourceUrl;
  }
}
