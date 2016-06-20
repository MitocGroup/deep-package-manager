/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import {Instance as Microservice} from '../../../Microservice/Instance';
import url from 'url';

export class GitHubStrategy extends AbstractStrategy {
  /**
   * @param {GitHubContext} moduleContext
   * @returns {String}
   */
  getModuleLocation(moduleContext) {
    return `https://codeload.github.com/${moduleContext.repository}/legacy.tar.gz/v${moduleContext.version}`;
  }

  /**
   * @param {GitHubContext} moduleContext
   * @returns {String}
   */
  getDbLocation(moduleContext) {
    return url.resolve(
      GitHubStrategy.GIT_API_BASE,
      `repos/${moduleContext.repository}/tags`
    );
  }

  /**
   * @param {GitHubContext} moduleContext
   * @returns {String}
   */
  getModuleBaseLocation(moduleContext) {
    let repoName = moduleContext.repository;
    let version = moduleContext.version;
    let name = moduleContext.name;

    return `https://raw.githubusercontent.com/${repoName}/v${version}/src/${name}`;
  }


  /**
   * @param {GitHubContext} moduleContext
   * @returns {String}
   */
  getModuleConfigLocation(moduleContext) {
    return `${this.getModuleBaseLocation(moduleContext)}/${Microservice.CONFIG_FILE}`;
  }

  /**
   * @returns {String}
   */
  static get GIT_API_BASE() {
    return 'https://api.github.com/';
  }
}
