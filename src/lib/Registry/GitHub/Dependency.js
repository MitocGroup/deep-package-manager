/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import request  from 'fetchy-request'
import gunzip  from 'gunzip-maybe'
import tar  from 'tar-stream'
import url  from 'url'
import { _extend as extend } from 'util'
import { WaitFor } from '../../Helpers/WaitFor'
import { SemVerStrategy } from '../Resolver/Strategy/SemVerStrategy'
import { StandardStrategy } from './ExtractStrategy/StandardStrategy'
import { Tag } from './Tag'

export class Dependency {
  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   */
  constructor(dependencyName, dependencyVersion) {
    this._dependencyName = dependencyName;
    this._dependencyVersion = dependencyVersion;
    this._fallbackToTag = null;

    this._repository = Dependency.parseDependencyRepository(dependencyName);
    this._authHeader = null;

    if (!this._repository) {
      throw new Error(`Unable to parse GitHub repository ${this.shortDependencyName}`);
    }

    Dependency.__cache__ = [];

    // @todo: Remove when GitHub rate issues fixed
    this.fallbackToMaster();
  }

  /**
   * @returns {Dependency}
   */
  fallbackToMaster() {
    this._fallbackToTag = 'master';

    return this;
  }

  /**
   * @returns {String}
   */
  get fallbackToTag() {
    return this._fallbackToTag;
  }

  /**
   * @param {String} tagName
   */
  set fallbackToTag(tagName) {
    this._fallbackToTag = tagName;
  }

  /**
   * @param {String} username
   * @param {String} token
   * @returns {Dependency}
   */
  auth(username, token) {
    let authHash = new Buffer(`${username}:${token}`).toString('base64');
    let headerValue = `Basic ${authHash}`;

    this._authHeader = {
      Authorization: headerValue,
    };

    return this;
  }

  /**
   * @returns {Object}
   */
  get authHeader() {
    return this._authHeader;
  }

  /**
   * @param {String} dumpPath
   * @param {Function} cb
   * @param {AbstractStrategy|StandardStrategy|*} extractStrategy
   */
  extract(dumpPath, cb, extractStrategy = null) {
    console.log(`Searching for suitable '${this.shortDependencyName}' dependency version`);

    this.findSuitableTag((error, tag) => {
      if (error) {
        cb(error);
        return;
      }

      console.log(`Fetching suitable '${this.shortDependencyName}' dependency version from '${tag.sourceUrl}'`);

      if (this._authHeader) {
        request(this._createRequestPayload(tag.sourceUrl))
          .then((response) => {
            Dependency._doOnRedirectResponse(response, (redirectUrl) => {
              console.log(`Following redirection to ${redirectUrl}`);

              request(this._createRequestPayload(redirectUrl))
                .then((response) => {
                  this._extractResponse(response, dumpPath, cb, extractStrategy);
                }).catch(cb);
            }, (response) => {
              this._extractResponse(response, dumpPath, cb, extractStrategy);
            });
          }).catch(cb);
      } else {
        let normalizedSourceUrl = Dependency._normalizeSourceUrl(tag.sourceUrl);

        console.log(`Switching between '${tag.sourceUrl}' and '${normalizedSourceUrl}' source urls`);

        request(this._createRequestPayload(normalizedSourceUrl))
          .then((response) => {
            this._extractResponse(response, dumpPath, cb, extractStrategy);
          }).catch(cb);
      }
    });
  }

  /**
   * @param {Response|*} response
   * @param {String} dumpPath
   * @param {Function} cb
   * @param {AbstractStrategy|StandardStrategy|null} extractStrategy
   * @private
   */
  _extractResponse(response, dumpPath, cb, extractStrategy) {
    if (!response.ok) {
      cb(response._error || new Error(response.statusText));
      return;
    }

    console.log(`Dumping '${this.shortDependencyName}' dependency into '${dumpPath}'`);

    extractStrategy = extractStrategy || new StandardStrategy(dumpPath);

    // Fixes deep-microservices-* cases
    extractStrategy.advancedMatcherFromDeepDepShortName &&
      extractStrategy.advancedMatcherFromDeepDepShortName(
        this.shortDependencyName
      );

    let unTarStream = tar.extract();

    let wait = new WaitFor();
    let filesToExtract = 0;

    wait.push(() => {
      return filesToExtract <= 0;
    });

    unTarStream.on('entry', (header, stream, next) => {
      if (header.type === 'directory') {
        next();
        return;
      }

      filesToExtract++;

      let filePath = header.name.replace(/^([^\/]+\/)/, '');

      extractStrategy.extract(filePath, stream, () => {
        filesToExtract--;

        next();
      });
    });

    unTarStream.on('finish', () => {
      wait.ready(cb);
    });

    let dataStream = response.body;
    dataStream.setDefaultEncoding('binary');

    dataStream
      .pipe(gunzip())
      .pipe(unTarStream);
  }

  /**
   * @param {String} sourceUrl
   * @returns {String}
   * @private
   *
   * @example https://codeload.github.com/MitocGroup/deep-microservices-todo-app/legacy.tar.gz/v0.0.1
   *          ---->
   *          https://api.github.com/repos/MitocGroup/deep-microservices-todo-app/tarball/v0.0.1
   */
  static _normalizeSourceUrl(sourceUrl) {
    let matches = sourceUrl.match(/https?:\/\/api\.github\.com\/repos\/([^\/]+\/[^\/]+)\/tarball\/([^\/]+)$/i);

    if (!matches || matches.length < 3) {
      return sourceUrl;
    }

    let repo = matches[1];
    let version = matches[2];

    return `https://codeload.github.com/${repo}/legacy.tar.gz/${version}`;
  }

  /**
   * @param {Object|*} response
   * @param {Function} onRedirectCb
   * @param {Function} otherwiseCb
   * @private
   */
  static _doOnRedirectResponse(response, onRedirectCb, otherwiseCb) {
    let headers = response.headers._headers;

    if (!headers.hasOwnProperty('location')) {
      otherwiseCb(response);
      return;
    }

    onRedirectCb(headers.location[0]);
  }

  /**
   * @param {Function} cb
   */
  findSuitableTag(cb) {
    if (Dependency.__cache__.hasOwnProperty(this._repository)) {
      console.log(`Using GitHub repository '${this._repository}' tags from cache`);

      cb(...this._findSuitable(Dependency.__cache__[this._repository]));
      return;
    }

    console.log(`Fetching GitHub repository '${this._repository}' tags`);

    this.getAvailableTags((error, tags) => {
      if (error) {

        // @todo: tweak this?
        if (this._fallbackToTag) {
          console.error(`Fallback to ${this._fallbackToTag} due to the error: ${error}`);

          cb(null, Tag.createFromRawMetadata(this._repository, this._fallbackTagRawMetadata));
          return;
        }

        cb(error, null);
        return;
      }

      Dependency.__cache__[this._repository] = tags;

      cb(...this._findSuitable(tags));
    });
  }

  /**
   * @returns {{name: string, zipball_url: *, tarball_url: *, commit: {sha: string, url: *}}}
   * @private
   */
  get _fallbackTagRawMetadata() {
    return {
      name: this._fallbackToTag,
      zipball_url: `https://api.github.com/repos/${this._repository}/zipball/${this._fallbackToTag}`,
      tarball_url: `https://api.github.com/repos/${this._repository}/tarball/${this._fallbackToTag}`,
      commit: {
        sha: 'd41d8cd98f00b204e9800998ecf8427e',
        url: `https://api.github.com/repos/${this._repository}/commits/d41d8cd98f00b204e9800998ecf8427e`,
      },
    };
  }

  /**
   * @param {Tag[]} tags
   * @returns {Array}
   * @private
   */
  _findSuitable(tags) {
    let semverStrategy = new SemVerStrategy();
    let versions = tags.map((tag) => tag.name);

    let matchedVersion = semverStrategy.resolve({
      getVersions: () => versions,
    }, this._dependencyVersion);

    if (!matchedVersion) {
      return [
        new Error(
          `No suitable version found for '${this.shortDependencyName}@${this._dependencyVersion}' (${versions.join(', ')})`
        ),
        null
      ];
    }

    for (let i in tags) {
      if (!tags.hasOwnProperty(i)) {
        continue;
      }

      let tag = tags[i];

      if (SemVerStrategy.CLEAN_FUNC(tag.name) === matchedVersion) {
        return [null, tag];
      }
    }
  }

  /**
   * @param {Function} cb
   */
  getAvailableTags(cb) {
    request(this._createRequestPayload(Dependency.TAGS_URI_TPL.replace(/\{repository\}/i, this._repository)))
      .then((response) => {
        if (!response.ok) {
          cb(response._error || new Error(response.statusText), null);
          return;
        }

        response
          .text()
          .then((plainData) => {
            try {
              cb(null, Tag.createFromMetadataVector(this._repository, JSON.parse(plainData)));
            } catch (error) {
              cb(error, null);
            }
          })
          .catch((error) => {
            cb(error, null);
          });
      }).catch((error) => {
        cb(error, null);
      });
  }

  /**
   * @returns {String}
   */
  get repositoryUser() {
    return this._repository.split('/')[0];
  }

  /**
   * @returns {String}
   */
  get shortDependencyName() {
    return this._repository.split('/')[1];
  }

  /**
   * @returns {String}
   */
  get dependencyName() {
    return this._dependencyName;
  }

  /**
   * @returns {String}
   */
  get dependencyVersion() {
    return this._dependencyVersion;
  }

  /**
   * @returns {String|*}
   */
  get repository() {
    return this._repository;
  }

  /**
   * @param {String} uri
   * @returns {Object}
   */
  _createRequestPayload(uri) {
    let uriParts = url.parse(uri, true);

    let payload = {
      uri: `${uriParts.protocol}//${uriParts.host}${uriParts.pathname}`,
      method: 'GET',
      retry: 3,
      headers: {
        Host: uriParts.host,
        'User-Agent': `deep-rq-${(new Date()).getTime()}`,
        Accept: '*/*',
      },
    };

    if (uriParts.query && Object.keys(uriParts.query).length > 0) {
      payload.qs = uriParts.query;
    }

    if (this._authHeader) {
      payload.headers = extend(payload.headers, this._authHeader);
    }

    return payload;
  }

  /**
   * @param {String} dependencyName
   * @returns {Boolean}
   */
  static isGitHubDependency(dependencyName) {
    return !!Dependency.parseDependencyRepository(dependencyName);
  }

  /**
   * @param {String} dependencyName
   * @returns {String|null}
   */
  static parseDependencyRepository(dependencyName) {
    let repo = dependencyName.match(/^github:\/\/([^\/]+\/[^\/]+)$/i);

    if (repo && repo.length === 2) {
      return repo[1].toString();
    }

    return null;
  }

  /**
   * @param {String} user
   * @param {String} repo
   * @returns {String}
   */
  static getDepName(user, repo) {
    return `github://${user}/${repo}`;
  }

  /**
   * @returns {String}
   */
  static get TAGS_URI_TPL() {
    return 'https://api.github.com/repos/{repository}/tags';
  }
}
