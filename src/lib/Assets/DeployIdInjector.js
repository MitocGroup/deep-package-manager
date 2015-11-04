/**
 * Created by AlexanderC on 11/4/15.
 */

'use strict';

import AssetsVersion from 'node-version-assets';
import {FileWalker} from '../Helpers/FileWalker';

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
    this._analysedExtensions = DeployIdInjector.DEFAULT_ANALYSED_EXTENSIONS;
  }

  /**
   * @param {Function} callback
   * @returns {DeployIdInjector}
   */
  prepare(callback = () => {}) {
    let assets = this._findAssets();
    let greps = this._findGreps();

    console.log(
      `${new Date().toTimeString()} Preparing to inject version #${this._deployId}` +
        `for ${assets.length} assets into ${greps.length} files`
    );

    let versionInstance = new AssetsVersion({
      newVersion: this._deployId,
      keepOriginalAndOldVersions: false,
      requireJs: false,
      keepOriginal: true, // @todo: remove when stable due to double sized frontend
      assets: assets,
      grepFiles: greps,
    });

    versionInstance.run(callback);

    return this;
  }

  /**
   * @returns {String[]}
   * @private
   */
  _findAssets() {
    return DeployIdInjector._fileWalker()
      .walk(
      this._path,
      FileWalker.matchExtensionsFilter(null, ...this._versionedExtensions)
    );
  }

  /**
   * @returns {String[]}
   * @private
   */
  _findGreps() {
    return DeployIdInjector._fileWalker(true)
      .walk(
        this._path,
        FileWalker.matchExtensionsFilter(null, ...this._analysedExtensions)
      );
  }

  /**
   * @private
   */
  static _fileWalker(useIgnore = false) {
    return new FileWalker(FileWalker.RECURSIVE, useIgnore ? DeployIdInjector.IGNORE_FILE : null);
  }

  /**
   * @returns {String[]}
   */
  get analysedExtensions() {
    return this._analysedExtensions;
  }

  /**
   * @param {String[]} analysedExtensions
   */
  set analysedExtensions(analysedExtensions) {
    this._analysedExtensions = analysedExtensions;
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
    return [
      'css', 'js', 'html', 'json',
      'png', 'jpeg', 'gif', 'ico', 'jpg', 'svg',
    ];
  }

  /**
   * @returns {String[]}
   * @constructor
   */
  static get DEFAULT_ANALYSED_EXTENSIONS() {
    return [
      'css', 'html', 'json',
    ];
  }

  /**
   * @returns {String}
   */
  static get IGNORE_FILE() {
    return '.deepinjectignore';
  }
}
