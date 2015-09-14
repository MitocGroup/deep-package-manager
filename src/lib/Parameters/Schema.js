/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

import {InvalidValuesException} from './Exception/InvalidValuesException';
import RamlSanitizer from 'raml-sanitize';
import RamlValidator from 'raml-validate';
import {PathTransformer} from './PathTransformer';
import {prompt} from 'prompt-sync';
import OS from 'os';
import {_extend as extend} from 'util';

export class Schema {
  /**
   * @param {Object} ramlModel
   */
  constructor(ramlModel) {
    this._validator = RamlValidator()(ramlModel);
    this._sanitizer = RamlSanitizer()(ramlModel);

    this._ramlModel = ramlModel;
  }

  /**
   * @returns {Object}
   */
  get ramlModel() {
    return this._ramlModel;
  }

  /**
   * @returns {Object}
   */
  get sanitizer() {
    return this._sanitizer;
  }

  /**
   * @returns {Object}
   */
  get validator() {
    return this._validator;
  }

  /**
   * @param {Object} obj
   * @returns {Object}
   */
  sanitize(obj) {
    return this._sanitizer(obj);
  }

  /**
   * @param {Object} obj
   * @returns {Object}
   */
  validate(obj) {
    return this._validator(obj);
  }

  /**
   * @returns {Object}
   */
  extractInteractive() {
    let obj = {};

    for (var key in this._ramlModel) {
      if (!this._ramlModel.hasOwnProperty(key)) {
        continue;
      }

      let def = this._ramlModel[key];

      Schema._showQuestionInfo(key, def);

      obj[key] = prompt() || def.default;
    }

    return this.extract(obj);
  }

  /**
   * @param {String} key
   * @param {Object} def
   * @returns {String}
   * @private
   */
  static _showQuestionInfo(key, def) {
    let name = def.displayName || key;
    let example = (def.example ? `@example '${def.example}'` : null) || '';
    let defaultValue = def.default ? `@default '${def.default}'` : null;

    console.log(new Array(name.length + 1).join('_'));
    console.log(name);
    console.log(defaultValue || example);
    console.log(def.required ? '@required' : '@optional');
  }

  /**
   * @param {Object} rawObj
   * @returns {Object}
   */
  extract(rawObj) {
    let obj = this.sanitize(extend({}, rawObj));
    let result = this.validate(obj);

    if (!result.valid) {
      throw new InvalidValuesException(result.errors);
    }

    return new PathTransformer().transform(obj);
  }
}
