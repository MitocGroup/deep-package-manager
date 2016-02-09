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
import stream from 'stream';

export class ModuleInstance {
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

    WaitFor.waterfall((file) => {
      let entryReady = false;
      let entryName = path.relative(modulePath, file);

      let readStream = fs.createReadStream(file);

      fs.stat(file, (error, fileStats) => {
        if (error) {
          console.error(error);
          entryReady = true;
          return;
        }

        let entry = tarStream.entry({name: entryName, size: fileStats.size,}, (error) => {
          if (error) {
            console.error(error);
            entryReady = true;
          }
        });

        readStream.on('data', (chunk) => {
          if (!entryReady) {
            try {
              entry.write(chunk.toString());
            } catch (error) {
              console.error(error);
              entryReady = true;
            }
          }
        });

        readStream.on('end', () => {
          if (!entryReady) {
            entry.end();

            entryReady = true;
          }
        });
      });

      return () => {
        return entryReady;
      };
    }, () => {
      this._rawContent = '';

      tarStream.on('data', (chunk) => {
        this._rawContent += chunk.toString();
      });

      tarStream.on('end', cb);
      tarStream.finalize();
    }, ...files);
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
