/**
 * Created by CCristi on 6/17/16.
 */

'use strict';

export class Context {
  /**
   * @param {String} name
   * @param {String} version
   */
  constructor(name, version) {
    this._name = name;
    this._version = version;
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
  get version() {
    return this._version;
  }

  /**
   * @param {String} name
   */
  set name(name) {
    this._name = name;
  }

  /**
   * @param {String} version
   */
  set version(version) {
    this._version = version;
  }

  /**
   * @returns {String}
   */
  toString() {
    return `${this._name}@${this._version}`;
  }

  /**
   * @param {String} name
   * @param {String} rawVersion
   * @returns {Context|GitHubContext}
   */
  static create(name, rawVersion) {
    // fixes babel issue: "Cannot call super of undefined" on `import {GitHubContext}` 
    let GitHubContext = require('../Context/GitHubContext').GitHubContext;

    if (GitHubContext.isGitHubVersion(rawVersion)) {
      return GitHubContext.create(name, rawVersion)
    }
    
    return new Context(name, rawVersion);
  }
}
