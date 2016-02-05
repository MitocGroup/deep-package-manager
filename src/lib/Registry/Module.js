/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import {ModuleConfig} from './ModuleConfig';
import fse from 'fs-extra';
import tar from 'tar-stream';
import string2stream from 'string2stream';
import {FileWalker} from '../Helpers/FileWalker';
import {WaitFor} from '../Helpers/WaitFor';
import path from 'path';
import fs from 'fs';

export class Module {
  /**
   * @param {String} moduleName
   * @param {String} moduleVersion
   * @param {String} rawContent
   * @param {Storage|*} storage
   */
  constructor(moduleName, moduleVersion, rawContent, storage) {
    this._moduleName = moduleName;
    this._moduleVersion = moduleVersion;
    this._storage = storage;
    this._rawContent = rawContent;
  }

  /**
   * @param {String} modulePath
   * @param {Function} cb
   */
  load(modulePath, cb) {
    let tarStream = tar.pack();

    let walker = new FileWalker(FileWalker.RECURSIVE);
    let files = walker.walk(modulePath);
    let remaining = files.length;

    let wait = new WaitFor();

    wait.push(() => {
      return files <= 0;
    });

    files.forEach((file) => {
      let entryName = path.relative(modulePath, file);

      fs.createReadStream(file).pipe(tarStream.entry({name: entryName,}, (error) => {
        remaining--;
      }));
    });

    wait.ready(() => {
      tarStream.finalize();

      let outputStream = string2stream();

      tarStream.on('finish', () => {
        this._rawContent = outputStream.toString();

        cb();
      });

      tarStream
        .finalize()
        .pipe(outputStream)
      ;
    });
  }

  /**
   * @param {String} dumpPath
   * @param {Function} cb
   */
  extract(dumpPath, cb) {
    fse.ensureDir(dumpPath, (error) => {
      if (error) {
        cb(error);
        return;
      }

      let extractStream = this.createExtractStream();
      let wait = new WaitFor();
      let filesToExtract = 0;

      wait.push(() => {
        return filesToExtract <= 0;
      });

      extractStream.on('entry', (header, stream, callback) => {
        let file = path.join(dumpPath, header.name);

        filesToExtract++;

        stream.pipe(fs.createWriteStream(file));

        stream.on('end', () => {
          filesToExtract--;
        });
      });

      extractStream.on('finish', () => {
        wait.ready(cb);
      });
    });
  }

  /**
   * @returns {stream}
   */
  createExtractStream() {
    let contentStream = string2stream(this._rawContent);
    let unTarStream = tar.extract();

    return contentStream.pipe(unTarStream);
  }

  /**
   * @param {Function} cb
   */
  upload(cb) {
    this._storage.uploadModule(this, cb);
  }

  /**
   * @returns {String}
   */
  toString() {
    return this._rawContent;
  }

  /**
   * @returns {String}
   */
  get rawContent() {
    return this._rawContent;
  }

  /**
   * @returns {Storage|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {String}
   */
  get moduleName() {
    return this._moduleName;
  }

  /**
   * @returns {String}
   */
  get moduleVersion() {
    return this._moduleVersion;
  }

  /**
   * @returns {String}
   */
  static get ARCHIVE_EXTENSION() {
    return 'tar';
  }
}
