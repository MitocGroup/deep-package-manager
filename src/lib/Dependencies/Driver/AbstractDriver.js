/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import Core from 'deep-core';
import FileSystem from 'fs';
import Path from 'path';
import Zlib from 'zlib';
import Tar from 'tar';
import FileStream from 'fstream';
import OS from 'os';
import {Hash} from '../../Helpers/Hash';
import {Exception} from '../Exception/Exception';

/**
 * Abstract dependency driver
 */
export class AbstractDriver extends Core.OOP.Interface {
  constructor() {
    super(['pull', 'push']);

    this._basePath = process.cwd();
    this._prefix = '';
    this._dryRun = false;
  }

  /**
   * @param {Boolean} state
   */
  set dryRun(state) {
    this._dryRun = state;
  }

  /**
   * @returns {Boolean}
   */
  get dryRun() {
    return this._dryRun;
  }

  /**
   * @param {String} prefix
   */
  set prefix(prefix) {
    this._prefix = prefix;
  }

  /**
   * @returns {String}
   */
  get prefix() {
    return this._prefix;
  }

  /**
   * @param {String} path
   */
  set basePath(path) {
    this._basePath = path;
  }

  /**
   * @returns {String}
   */
  get basePath() {
    return this._basePath;
  }

  /**
   *
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Boolean} prefixed
   * @returns {String}
   */
  _getArchivePath(dependencyName, dependencyVersion, prefixed = false) {
    return Path.join(
      this._basePath,
      this[prefixed ? '_getPrefixedBasename' : '_getBasename'](dependencyName, dependencyVersion)
    );
  }

  /**
   *
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Boolean} prefixed
   * @returns {String}
   */
  _getFolderPath(dependencyName, dependencyVersion, prefixed = false) {
    return Path.join(
      this._basePath,
      this[prefixed ? '_getPrefixedBasename' : '_getBasename'](dependencyName, dependencyVersion, true)
    );
  }

  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Boolean} skipExtension
   * @returns {String}
   */
  _getPrefixedBasename(dependencyName, dependencyVersion, skipExtension = false) {
    return Path.join(this._prefix, this._getBasename(dependencyName, dependencyVersion, skipExtension));
  }

  /**
   * @param {String} dependencyName
   * @param {String} dependencyVersion
   * @param {Boolean} skipExtension
   * @returns {String}
   */
  _getBasename(dependencyName, dependencyVersion, skipExtension = false) {
    let basename = `${dependencyName}-${dependencyVersion}`;

    return skipExtension ? basename : `${basename}${AbstractDriver.ARCHIVE_EXTENSION}`;
  }

  /**
   * @param {String} inputPath
   * @param {String} archivePath
   * @param {Function} callback
   */
  _pack(inputPath, archivePath, callback) {
    let packer = Tar.Pack();
    let zpacker = Zlib.createGzip();

    let reader = FileStream.Reader({
      path: inputPath,
      type: 'Directory',
    });

    let dumper = FileStream.Writer({
      path: archivePath,
      type: 'File',
    });

    reader.on('error', AbstractDriver.errorCallback('reading sources'));
    zpacker.on('error', AbstractDriver.errorCallback('packing using zlib'));
    packer.on('error', AbstractDriver.errorCallback('packing using tar'));
    dumper.on('error', AbstractDriver.errorCallback('dumping archive'));

    reader
      .pipe(packer)
      .pipe(zpacker)
      .pipe(dumper);

    dumper.on('end', () => {
      callback(archivePath);
    });
  }

  /**
   * @param {String} archivePath
   * @param {Function} callback
   */
  _unpack(archivePath, callback) {
    let archiveDirectory = Path.dirname(archivePath);
    let outputPath = Path.join(
      archiveDirectory,
      Path.basename(archivePath, AbstractDriver.ARCHIVE_EXTENSION)
    );

    let reader = FileSystem.createReadStream(archivePath);

    let unPacker = Tar.Extract({
      strip: true,
      path: outputPath,
      type: 'Directory',
    });
    let zunPacker = Zlib.createGunzip();

    reader.on('error', AbstractDriver.errorCallback('reading archive'));
    zunPacker.on('error', AbstractDriver.errorCallback('unpacking using zlib'));
    unPacker.on('error', AbstractDriver.errorCallback('unpacking using tar'));

    reader
      .pipe(zunPacker)
      .pipe(unPacker);

    unPacker.on('end', () => {
      callback(outputPath);
    });
  }

  /**
   * @param {String} descriptor
   * @returns {Function}
   */
  static errorCallback(descriptor) {
    return (error) => {
      throw new Exception(`Error while ${descriptor}: ${error}`);
    };
  }

  /**
   * @param {String} identifier
   * @returns {String}
   */
  static getTmpDir(identifier) {
    return Path.join(
      OS.tmpdir(),
      Hash.md5(identifier) + '-' + (new Date()).getTime()
    );
  }

  /**
   * @returns {String}
   */
  static get ARCHIVE_EXTENSION() {
    return '.tar.gz';
  }
}
