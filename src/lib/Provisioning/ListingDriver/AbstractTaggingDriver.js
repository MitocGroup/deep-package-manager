/**
 * Created by CCristi on 4/24/17.
 */

'use strict';

import AWS from 'aws-sdk';
import {AbstractDriver} from './AbstractDriver';
import {AbstractService as AbstractProvisionService} from '../Service/AbstractService';
import {AbstractDriver as Tagging} from '../ResourceTagging/Driver/AbstractDriver';

export class AbstractTaggingDriver extends AbstractDriver {
  /**
   * @param {Object[]} args
   */
  constructor(...args) {
    super(...args);

    this._taggingService = new AWS.ResourceGroupsTaggingAPI({
      region: this.awsService.config.region,
    });
  }

  /**
   * @returns {Promise}
   */
  listFilteredResources() {
    return this.listResources().then(resources => resources.filter(this._filterResource.bind(this)));
  }

  /**
   * @param {Object} resource
   * @returns {*}
   * @private
   */
  _filterResource(resource) {
    let resourceId = this._generateResourceIdFromTags(resource.Tags);

    return resourceId && this._matchResource(resourceId);
  }

  /**
   * @param {Object[]} tagsVector
   * @returns {String}
   * @private
   */
  _generateResourceIdFromTags(tagsVector) {
    let tags = tagsVector.reduce((tagsObj, tagItem) => {
      tagsObj[tagItem.Key] = tagItem.Value;

      return tagsObj;
    }, {});

    let envNameKey = Tagging.ENVIRONMENT_NAME_KEY;
    let envIdKey = Tagging.ENVIRONMENT_ID_KEY;
    let awsResourcePrefix = AbstractProvisionService.AWS_RESOURCES_PREFIX;

    if (tags.hasOwnProperty(envNameKey) && tags.hasOwnProperty(envIdKey)) {
      return `${awsResourcePrefix}.${tags[envNameKey]}.resource.${tags[envIdKey]}`;
    }

    return null;
  }

  /**
   * @param {String} _token
   * @returns {Promise}
   */
  listResources(_token = null) {
    const payload = {
      TagsPerPage: this.constructor.DEFAULT_TAGS_PER_PAGE,
      ResourceTypeFilters: [].concat(this.resourceType()),
      TagFilters: [],
    };

    if (_token) {
      payload.PaginationToken = _token;
    }

    return this._taggingService.getResources(payload).promise().then(response => {
      const resourcesList = response.ResourceTagMappingList;

      if (response.PaginationToken) {
        return this.listResources(response.PaginationToken).then(childResources => {
          return resourcesList.concat(childResources);
        });
      }

      return resourcesList;
    });
  }

  /**
   * @todo: inherit this method in implementations
   * @returns {String}
   */
  resourceType() {
    return '';
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_TAGS_PER_PAGE() {
    return 500;
  }
}
