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
    return `https://codeload.github.com/${moduleContext.repository}` +
      `/legacy.tar.gz/${this._gitVersion(moduleContext.version)}`;
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
   * @param {String} version
   * @returns {String}
   * @private
   */
  _gitVersion(version) {
    return /^\s*[\d\.]+\s*$/.test(version) ? `v${version}` : version;
  }

  /**
   * @param {GitHubContext} moduleContext
   * @returns {String}
   */
  getModuleBaseLocation(moduleContext) {
    let repoName = moduleContext.repository;
    let version = moduleContext.version;
    let name = moduleContext.name;

    return `https://raw.githubusercontent.com/${repoName}/${this._gitVersion(version)}/src/${name}`;
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
