/**
 * Created by AlexanderC on 6/17/15.
 */

'use strict';

import JsonFile from 'jsonfile';
import Joi from 'joi';
import Path from 'path';
import parametersSchema from './parameters.schema';
import {InvalidConfigException} from './Exception/InvalidConfigException';
import FileSystem from 'fs';
import {Extractor} from '../Parameters/Extractor';

/**
 * User defined parameters
 */
export class Parameters {
  /**
   * @param {Object} rawParameters
   * @param {String} workingDir
   */
  constructor(rawParameters = {}, workingDir = null) {
    this._rawParameters = rawParameters;
    this._workingDir = workingDir;

    this._parsedObject = Joi.validate(this._rawParameters, parametersSchema);
    this._filledObject = null;
  }

  /**
   * @returns {Object}
   */
  get rawParameters() {
    return this._rawParameters;
  }

  /**
   * Validates raw object
   *
   * @returns {Boolean}
   */
  get valid() {
    return !this.error;
  }

  /**
   * Retrieve parse error if available
   *
   * @returns {String}
   */
  get error() {
    return this._parsedObject.error;
  }

  /**
   * Extracts parsed configuration
   *
   * @param {String} type
   * @returns {Object}
   */
  extract(type = null) {
    if (!this.valid) {
      throw new InvalidConfigException(this.error);
    }

    if (!this._filledObject) {
      this._fillParametersObject();
    }

    return type ? this._filledObject[type] : this._filledObject;
  }

  /**
   * @private
   */
  _fillParametersObject() {
    if (!this.valid) {
      return;
    }

    let paramsObj = this._parsedObject.value;

    if (paramsObj.hasOwnProperty(Parameters.GLOBALS)) {
      paramsObj[Parameters.GLOBALS] = new Extractor(paramsObj[Parameters.GLOBALS]).extractOptimal(
        this._workingDir,
        Parameters.GLOBALS
      );
    }

    paramsObj[Parameters.FRONTEND] = new Extractor(paramsObj[Parameters.FRONTEND]).extractOptimal(
      this._workingDir,
      Parameters.FRONTEND
    );
    paramsObj[Parameters.BACKEND] = new Extractor(paramsObj[Parameters.BACKEND]).extractOptimal(
      this._workingDir,
      Parameters.BACKEND
    );

    this._filledObject = paramsObj;

    // @todo: move this?
    Extractor.dumpParameters(this._workingDir, paramsObj, true);
  }

  /**
   * @returns {String}
   */
  static get GLOBALS() {
    return 'globals';
  }

  /**
   * @returns {String}
   */
  static get FRONTEND() {
    return 'frontend';
  }

  /**
   * @returns {String}
   */
  static get BACKEND() {
    return 'backend';
  }

  /**
   * Read microservice configuration from json file
   *
   * @param {String} file
   */
  static createFromJsonFile(file) {
    let rawParameters = {
      frontend: {},
      backend: {},
    };

    if (FileSystem.existsSync(file)) {
      rawParameters = JsonFile.readFileSync(file);
    }

    return new Parameters(rawParameters, Path.dirname(file));
  }
}
