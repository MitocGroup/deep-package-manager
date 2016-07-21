/**
 * Created by AlexanderC on 11/4/15.
 */

'use strict';

import {FileWalker} from '../Helpers/FileWalker';
import {AssetReplacer} from './AssetReplacer';

/**
 * @todo: There is currently some overhead
 *        mainly left due to compatibility issues
 */
export class DeployIdInjector {
  /**
   * @param {String} path
   * @param {String} deployId
   */
  constructor(path, deployId) {
    this._path = path;
    this._deployId = deployId;

    this._versionedExtensions = DeployIdInjector.DEFAULT_VERSIONED_EXTENSIONS;
  }

  /**
   * @param {Function} callback
   * @returns {DeployIdInjector}
   */
  prepare(callback = () => {}) {
    let assets = this._findAssets();

    console.debug(
      `Preparing to inject version #${this._deployId} into ${assets.length} assets`
    );

    let replacer = AssetReplacer.create(this._deployId, 'url');

    try {
      replacer.replace(...assets);
    } catch (error) {
      callback(error);

      return this;
    }

    callback(null);

    return this;
  }

  /**
   * @returns {String[]}
   * @private
   */
  _findAssets() {
    return DeployIdInjector._fileWalker(true)
      .walk(
      this._path,
      FileWalker.matchExtensionsFilter(null, ...this._versionedExtensions)
    );
  }

  /**
   * @param {Boolean} useIgnore
   * @returns {FileWalker}
   * @private
   */
  static _fileWalker(useIgnore = false) {
    return new FileWalker(
      FileWalker.RECURSIVE,
      useIgnore ? DeployIdInjector.IGNORE_FILE : null
    );
  }

  /**
   * @returns {String[]}
   */
  get versionedExtensions() {
    return this._versionedExtensions;
  }

  /**
   * @param {String[]} versionedExtensions
   */
  set versionedExtensions(versionedExtensions) {
    this._versionedExtensions = versionedExtensions;
  }

  /**
   * @returns {String}
   */
  get deployId() {
    return this._deployId;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {String[]}
   * @constructor
   */
  static get DEFAULT_VERSIONED_EXTENSIONS() {
    return ['css', 'html',];
  }

  /**
   * @returns {String}
   */
  static get IGNORE_FILE() {
    return '.deepinjectignore';
  }
}
