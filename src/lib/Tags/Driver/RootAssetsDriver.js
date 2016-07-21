/**
 * Created by CCristi <ccovali@mitocgroup.com> on 2/23/16.
 */

'use strict';

import path from 'path';
import OS from 'os';
import FileSystem from 'graceful-fs';
import {AbstractDriver} from './AbstractDriver';
import {FileWalker} from '../../Helpers/FileWalker';
import {UnknownAssetException} from './Exception/UnknownAssetException';

/**
 * Root Assets Driver
 */
export class RootAssetsDriver extends AbstractDriver {
  /**
   * @param {Object} microservicesConfig
   */
  constructor(microservicesConfig) {
    super();

    this._microservicesConfig = microservicesConfig;
  }

  /**
   * @param {String} htmlContent
   * @returns {*}
   */
  inject(htmlContent) {
    let scriptContent = this._assetsPaths.map(this._buildAssetTag.bind(this)).join(OS.EOL);

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
    let files = [];

    for (let msIdentifier in this._microservicesConfig) {
      if (!this._microservicesConfig.hasOwnProperty(msIdentifier)) {
        continue;
      }

      let msConfig = this._microservicesConfig[msIdentifier];
      let rootAssetsPath = path.join(
        msConfig.autoload.frontend,
        RootAssetsDriver.ROOT_ASSETS_FOLDER
      );

      if (!FileSystem.existsSync(rootAssetsPath)) {
        continue;
      }

      let msRootAssets = new FileWalker().walk(rootAssetsPath, (file) => {
        return RootAssetsDriver.ASSET_REGEXP.test(file);
      });

      files = files.concat(msRootAssets.map((file) => {
        return path.join(
          path.sep, msConfig.identifier,
          RootAssetsDriver.ROOT_ASSETS_FOLDER, file.substr(rootAssetsPath.length)
        );
      }));
    }

    return files;
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
  static get ROOT_ASSETS_FOLDER() {
    return 'root_assets';
  }

  /**
   * @returns {string}
   */
  static get TAG_SUFFIX() {
    return 'root-assets';
  }
}
