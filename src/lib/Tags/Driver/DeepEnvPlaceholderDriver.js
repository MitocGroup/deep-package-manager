/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class DeepEnvPlaceholderDriver extends AbstractDriver {
  /**
   * @param {Object} microserviceConfig
   */
  constructor(microserviceConfig) {
    super();

    this._microserviceConfig = microserviceConfig;
  }

  /**
   * @returns {Object}
   */
  get microserviceConfig() {
    return this._microserviceConfig;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let placeholdersMapping = this._placeholdersMapping;

    for (let placeholder in placeholdersMapping) {
      if (!placeholdersMapping.hasOwnProperty(placeholder)) {
        continue;
      }

      let replacement = placeholdersMapping[placeholder];

      htmlContent = htmlContent.replace(
        this._buildPlaceholderRegexp(placeholder),
        replacement
      );
    }

    return htmlContent;
  }

  /**
   * @param {String} placeholder
   * @returns {RegExp|*}
   * @example root-assets-path => $\{\s*deep-root-assets-path\s*\}
   */
  _buildPlaceholderRegexp(placeholder) {
    return new RegExp(`\\$\\{\\s*deep\\-${placeholder}\\s*\\}`, 'ig');
  }

  /**
   * @returns {Object}
   */
  get _placeholdersMapping() {
    return {
      'root-assets-path': this._microserviceConfig.isRoot ?
        '' :
        `/${this._microserviceConfig.identifier}`,
    };
  }
}
