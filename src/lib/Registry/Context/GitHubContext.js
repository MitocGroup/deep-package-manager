/**
 * Created by CCristi on 6/17/16.
 */

'use strict';

import {Context} from './Context';
import {DependenciesResolver} from '../Resolver/DependenciesResolver';

export class GitHubContext extends Context {
  /**
   * @param {String} name
   * @param {String} version
   * @param {String} repository
   */
  constructor(name, version, repository) {
    super(name, version);

    this._repository = repository;
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
  get repositoryUser() {
    return this._repository.split('/')[0];
  }

  /**
   * @param {String} name
   * @param {String} rawVersion
   * @returns {GitHubContext}
   */
  static create(name, rawVersion) {
    let parts = GitHubContext.parseGitHubVersion(rawVersion);

    return new GitHubContext(name, parts[0], parts[1]);
  }

  /**
   * @param {String} version
   * @returns {*}
   */
  static parseGitHubVersion(version) {
    let parts = version.match(/github:\/\/([^\/#]+\/[^\/#]+)(#[\d\.\*]+)?$/);

    if (parts && parts.length === 3) {
      return [
        parts[2] ? parts[2].substr(1) : DependenciesResolver.VERSION_ANY,
        parts[1],
      ];
    }

    return null;
  }

  /**
   * @param {String} version
   * @returns {boolean}
   */
  static isGitHubVersion(version) {
    return !!GitHubContext.parseGitHubVersion(version);
  }
}
