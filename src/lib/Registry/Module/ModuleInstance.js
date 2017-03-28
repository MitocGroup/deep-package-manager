/**
 * Created by AlexanderC on 2/3/16.
 */

'use strict';

import fse from 'fs-extra';
import createOutputStream from 'create-output-stream';
import tar from 'tar-stream';
import string2stream from 'string2stream';
import {FileWalker} from '../../Helpers/FileWalker';
import {WaitFor} from '../../Helpers/WaitFor';
import {GitHubContext} from '../Context/GitHubContext';
import {GitHubModuleInstance} from './GitHubModuleInstance';
import {AbstractModuleInstance} from './AbstractModuleInstance';
import path from 'path';
import fs from 'fs';

export class ModuleInstance extends AbstractModuleInstance {
  /**
   * @param {Context} moduleContext
   * @param {String} rawContent
   * @param {Storage|*} storage
   */
  constructor(moduleContext, rawContent, storage) {
    super();

    this._context = moduleContext;
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

      fs.readFile(file, {encoding: 'ascii',}, (error, fileContent) => {
        if (error) {
          console.error(error);
        } else {
          let plainFileContent = fileContent.toString();

          tarStream.entry({name: entryName, size: plainFileContent.length,}, plainFileContent);
        }

        entryReady = true;
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

      let contentStream = string2stream(this._rawContent);
      let unTarStream = tar.extract();

      let wait = new WaitFor();
      let filesToExtract = 0;

      wait.push(() => {
        return filesToExtract <= 0;
      });

      unTarStream.on('entry', (header, stream, next) => {
        let file = path.join(dumpPath, header.name);

        filesToExtract++;

        stream.pipe(createOutputStream(file));

        stream.on('end', () => {
          filesToExtract--;

          next();
        });
      });

      unTarStream.on('finish', () => {
        wait.ready(cb);
      });

      contentStream.pipe(unTarStream);
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
    return this._context.name;
  }

  /**
   * @returns {String}
   */
  get moduleVersion() {
    return this._context.version;
  }

  /**
   * @returns {Context|GitHubContext}
   */
  get context() {
    return this._context;
  }

  /**
   * @param {Context} moduleContext
   * @param {String} rawContent
   * @param {Storage} storage
   * @returns {*}
   */
  static create(moduleContext, rawContent, storage) {
    let ModuleProto = moduleContext instanceof GitHubContext ?
      GitHubModuleInstance :
      ModuleInstance;

    return new ModuleProto(moduleContext, rawContent, storage);
  }

  /**
   * @returns {String}
   */
  static get ARCHIVE_EXTENSION() {
    return 'tar';
  }
}
