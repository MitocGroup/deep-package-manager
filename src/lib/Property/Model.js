/**
 * Created by AlexanderC on 6/5/15.
 */

'use strict';

import {FileWalker} from '../Helpers/FileWalker';
import Path from 'path';
import JsonFile from 'jsonfile';
import FileSystem from 'fs';

/**
 * DB model class
 */
export class Model {
  /**
   * @param {String} name
   * @param {Object} definition
   */
  constructor(name, definition) {
    this._name = name;
    this._definition = definition;
  }

  /**
   * @param directories
   * @returns {Model[]}
   */
  static create(...directories) {
    let ext = Model.EXTENSION;
    let walker = new FileWalker(FileWalker.RECURSIVE);
    let filter = FileWalker.matchExtensionsFilter(FileWalker.skipDotsFilter(), ext);

    let models = [];

    for (let i in directories) {
      if (!directories.hasOwnProperty(i)) {
        continue;
      }

      let dir = directories[i];

      if (FileSystem.existsSync(dir)) {
        let files = walker.walk(dir, filter);

        for (let j in files) {
          if (!files.hasOwnProperty(j)) {
            continue;
          }

          let modelFile = files[j];

          let name = Path.basename(modelFile, `.${ext}`);
          let definition = JsonFile.readFileSync(modelFile);

          models.push(new Model(name, definition));
        }
      }
    }

    return models;
  }

  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }

  /**
   * @returns {Object}
   */
  get definition() {
    return this._definition;
  }

  /**
   * @returns {String}
   */
  static get EXTENSION() {
    return 'json';
  }

  /**
   * @returns {Object}
   */
  extract() {
    let obj = {};

    obj[this._name] = this._definition;

    return obj;
  }
}