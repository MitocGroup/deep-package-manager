/**
 * Created by CCristi <ccovali@mitocgroup.com> on 2/23/16.
 */

'use strict';

import path from 'path';
import FileSystem from 'graceful-fs';
import {AbstractDriver} from './AbstractDriver';
import {FileWalker} from '../../Helpers/FileWalker';
import {UnknownAssetException} from './Exception/UnknownAssetException';

/**
 * Root Assets Driver
 */
export class RootAssetsDriver extends AbstractDriver {
  /**
   * @param {Object} microservices
   */
  constructor(microservices) {
    super();

    this._microservices = microservices;
  }

  /**
   * @param {String} htmlContent
   * @returns {*}
   */
  inject(htmlContent) {
    let scriptContent = this._assetsPaths.map(this._buildAssetTag.bind(this)).join(/* OS.EOL */);

    return this.replaceTags(
      htmlContent,
      RootAssetsDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {Array}
   * @private
   */
  get _assetsPaths() {
    // Object.values has browser compatibility issues
    let msPaths = Object.keys(this._microservices).map((msIdentifier) => {
      return path.join(this._microservices[msIdentifier].localPath, RootAssetsDriver.MS_ROOT_ASSETS_PATH)
    });

    return msPaths.reduce((files, msPath) => {
      if (!FileSystem.existsSync(msPath)) {
        return files;
      }

      let msAssets = new FileWalker().walk(msPath, (file) => {
        return file.test(RootAssetsDriver.ASSET_REGEXP);
      });

      return files.concat(msAssets.map(file => file.substr(msPath.length)));
    }, []);
  }

  /**
   * @param {String} file
   * @returns {*}
   * @private
   */
  _buildAssetTag(file) {
    let matches = file.match(RootAssetsDriver.ASSET_REGEXP);

    switch(matches[1]) {
      case 'js':
        return `<script type="text/javascript" src="${file}"></script>`;
      case 'css':
        return `<link rel="stylesheet" href="${file}"/>`;
    }

    throw new UnknownAssetException(file);
  }

  /**
   * @returns {RegExp}
   */
  static get ASSET_REGEXP() {
    return /^(?:.*[\/|\\])?(?:[^\/\\]+)\.(js|css)$/;
  }

  /**
   * @returns {string}
   */
  static get MS_ROOT_ASSETS_PATH() {
    return 'root_assets';
  }

  /**
   * @returns {string}
   */
  static get TAG_SUFFIX() {
    return 'root-assets';
  }
}
