/**
 * Created by AlexanderC on 6/5/15.
 */

'use strict';

import {FileWalker} from '../Helpers/FileWalker';
import Path from 'path';

export class ValidationSchema {
  /**
   * @param {String} name
   * @param {String} schemaPath
   */
  constructor(name, schemaPath) {
    this._name = name;
    this._schemaPath = schemaPath;
  }

  /**
   * @param directories
   * @returns {Model[]}
   */
  static create(...directories) {
    let walker = new FileWalker(FileWalker.RECURSIVE);
    let filter = FileWalker.matchExtensionsFilter(
      FileWalker.skipDotsFilter(),
      ValidationSchema.EXTENSION_JSON,
      ValidationSchema.EXTENSION_JS
    );

    let validationSchemas = [];

    for (let i in directories) {
      if (!directories.hasOwnProperty(i)) {
        continue;
      }

      let dir = directories[i];
      let files = walker.walk(dir, filter);

      for (let j in files) {
        if (!files.hasOwnProperty(j)) {
          continue;
        }

        let schemaFile = files[j];
        let name = Path.basename(schemaFile).replace(/\.[^/.]+$/, '');

        validationSchemas.push(new ValidationSchema(name, schemaFile));
      }
    }

    return validationSchemas;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {String}
   */
  get schemaPath() {
    return this._schemaPath;
  }

  /**
   * @returns {String}
   */
  static get EXTENSION_JSON() {
    return 'json';
  }

  /**
   * @returns {String}
   */
  static get EXTENSION_JS() {
    return 'js';
  }
}
