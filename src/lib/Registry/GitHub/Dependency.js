/**
 * Created by AlexanderC on 2/19/16.
 */

'use strict';

import {Tag} from './Tag';
import {SemVerStrategy} from '../Resolver/Strategy/SemVerStrategy';
import request from 'fetchy-request';
import tar from 'tar-stream';
import gunzip from 'gunzip-maybe';
import {WaitFor} from '../../Helpers/WaitFor';
import {StandardStrategy} from './ExtractStrategy/StandardStrategy';
import {_extend as extend} from 'util';
import url from 'url';

export class Dependency {
  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   */
  constructor(dependencyName, dependencyVersion) {
    this._dependencyName = dependencyName;
    this._dependencyVersion = dependencyVersion;

    this._repository = Dependency.parseDependencyRepository(dependencyName);
    this._authHeader = null;

    if (!this._repository) {
      throw new Error(`Unable to parse GitHub repository ${this.shortDependencyName}`);
    }

    Dependency.__cache__ = [];
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

    let dataStream = response._raw;

    dataStream
      .pipe(gunzip())
      .pipe(unTarStream);
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
        cb(error, null);
        return;
      }

      Dependency.__cache__[this._repository] = tags;

      cb(...this._findSuitable(tags));
    });
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
        'User-Agent': 'User-Agent	Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11) ' +
                      'AppleWebKit/601.1.56 (KHTML, like Gecko) Version/9.0 Safari/601.1.56',
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
