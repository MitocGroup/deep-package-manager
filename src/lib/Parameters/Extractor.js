/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

import {Schema} from './Schema';
import Path from 'path';
import JsonFile from 'jsonfile';
import FileSystem from 'fs';
import {PathTransformer} from './PathTransformer';
import {_extend as extend} from 'util';

export class Extractor {
  /**
   * @param {Object} schema
   */
  constructor(schema = null) {
    this._schema = schema;
  }

  /**
   * @returns {Object}
   */
  get rawSchema() {
    return this._schema;
  }

  /**
   * @param {Object} schema
   * @returns {Object}
   */
  schema(schema = null) {
    schema = schema || this._schema;

    return new Schema(schema);
  }

  /**
   * @param {Object} obj
   * @param {Object} schema
   * @returns {Object}
   */
  extract(obj, schema = null) {
    return this.schema(schema).extract(obj);
  }

  /**
   * @param {String} workingDir
   * @returns {string}
   */
  static parametersFile(workingDir = null) {
    return Path.join(workingDir || process.cwd(), Extractor.PARAMETERS_FILE);
  }

  /**
   * @param {String} workingDir
   * @param {Object} obj
   * @param {Boolean} plainifyNested
   * @returns {String}
   */
  static dumpParameters(workingDir, obj, plainifyNested = false) {
    let file = Extractor.parametersFile(workingDir);

    let dumpObj = extend({}, obj);

    if (!plainifyNested) {
      dumpObj = new PathTransformer().plainify(dumpObj);
    } else {
      let transformer = new PathTransformer();

      for (let key in dumpObj) {
        if (!dumpObj.hasOwnProperty(key)) {
          continue;
        }

        dumpObj[key] = transformer.plainify(dumpObj[key]);
      }
    }

    JsonFile.writeFileSync(file, dumpObj);

    return file;
  }

  /**
   * @param {String} workingDir
   * @param {String} subSection
   * @param {Object} schema
   * @returns {Object}
   */
  extractOptimal(workingDir = null, subSection = null, schema = null) {
    let file = Extractor.parametersFile(workingDir);

    if (FileSystem.existsSync(file)) {
      return this.extractFromFile(file, subSection, schema);
    }

    return this.extractInteractive(schema);
  }

  /**
   * @param {String} file
   * @param {String} subSection
   * @param {Object} schema
   * @returns {Object}
   */
  extractFromFile(file = null, subSection = null, schema = null) {
    file = file || Extractor.PARAMETERS_FILE;

    let content = JsonFile.readFileSync(file);

    return this.extract(subSection ? content[subSection] : content, schema);
  }

  /**
   * @param {Object} schema
   * @returns {Object}
   */
  extractInteractive(schema = null) {
    return this.schema(schema).extractInteractive();
  }

  /**
   * @returns {String}
   */
  static get PARAMETERS_FILE() {
    return '.parameters.json';
  }
}
