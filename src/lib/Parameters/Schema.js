/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

import {InvalidValuesException} from './Exception/InvalidValuesException';
import RamlSanitizer from 'raml-sanitize';
import RamlValidator from 'raml-validate';
import {PathTransformer} from './PathTransformer';
import {Prompt} from '../Helpers/Terminal/Prompt';
import {_extend as extend} from 'util';
import OS from 'os';

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

      let prompt = new Prompt(Schema._getQuestionInfo(key, def));
      prompt.syncMode = true;

      // don't be afraid of cb since it's in sync mode
      prompt.read((answer) => {
        obj[key] = answer || def.default;
      });
    }

    return this.extract(obj);
  }

  /**
   * @param {String} key
   * @param {Object} def
   * @returns {String}
   * @private
   */
  static _getQuestionInfo(key, def) {
    let name = def.displayName || key;
    let example = (def.hasOwnProperty('example') ? `@example '${def.example}'` : null) || '';
    let defaultValue = def.hasOwnProperty('default') ? `@default '${def.default}'` : null;

    let text = [];

    text.push(new Array(name.length + 1).join('_'));
    text.push(name);
    text.push(defaultValue || example);
    text.push(def.required ? '@required' : '@optional');

    return text.join(OS.EOL);
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
