/**
 * Created by CCristi on 6/16/16.
 */

'use strict';

import {ModuleInstance} from './ModuleInstance';
import {StandardStrategy} from '../GitHub/ExtractStrategy/StandardStrategy';
import {WaitFor} from '../../Helpers/WaitFor';
import {GitHubDriver} from '../Storage/Driver/GitHubDriver';
import tar from 'tar-stream';
import gunzip from 'gunzip-maybe';
import path from 'path';
import fse from 'fs-extra';

export class GitHubModuleInstance extends ModuleInstance {
  /**
   * @param {Object} args
   */
  constructor(...args) {
    super(...args);
  }

  /**
   * @param {String} dumpPath
   * @param {Function} cb
   */
  extract(dumpPath, cb) {
    let moduleUri = this.storage.strategy.getModuleLocation(this.context);

    this._gitHubDriver.readObjStreamed(moduleUri, (error, streamResponse) => {
      if (error) {
        cb(error, null);
        return;
      }
      
      this._extractResponse(streamResponse, dumpPath, cb);
    });
  }

  /**
   * @param {stream.Stream|*} dataStream
   * @param {String} dumpPath
   * @param {Function} cb
   * @param {AbstractStrategy|StandardStrategy|null} extractStrategy
   * @private
   */
  _extractResponse(dataStream, dumpPath, cb, extractStrategy = null) {
    console.debug(`Dumping '${this.context.name}' dependency into '${dumpPath}'`);

    extractStrategy = extractStrategy || new StandardStrategy(dumpPath);

    // Fixes deep-microservices-* cases
    extractStrategy.advancedMatcherFromDeepDepShortName &&
    extractStrategy.advancedMatcherFromDeepDepShortName(
      this.context.name
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

      if (this._haveToDump(filePath)) {
        let file = path.join(dumpPath, StandardStrategy.normalizeFilePath(filePath));
        let output = fse.createOutputStream(file);

        output.on('finish', () => {
          filesToExtract--;
          next();
        });

        stream.pipe(output);
        return;
      }

      filesToExtract--;
      next();
    });

    unTarStream.on('finish', () => {
      wait.ready(cb);
    });

    dataStream.setDefaultEncoding('binary');

    dataStream
      .pipe(gunzip())
      .pipe(unTarStream);
  }

  /**
   * @param {String} filePath
   * @returns {Boolean}
   * @private
   */
  _haveToDump(filePath) {
    let depName = this.context.name;
    let regExp = new RegExp(
      `^\/?src\/${depName}\/`,
      'i'
    );

    return regExp.test(filePath);
  }

  /**
   * @returns {GitHubDriver}
   */
  get _gitHubDriver() {
    return this.storage.driver.find(GitHubDriver);
  }
}
