/**
 * Created by AlexanderC on 11/3/15.
 */

'use strict';

import readline from 'readline';
import { ReadlineSync } from './ReadlineSync';

export class Prompt {

  /**
   * @param {String} text
   */
  constructor(text) {
    this._text = text;
    this._syncMode = false;
  }

  /**
   * @returns {Boolean}
   */
  get syncMode() {
    return this._syncMode;
  }

  /**
   * @param {Boolean} state
   */
  set syncMode(state) {
    this._syncMode = state;
  }

  /**
   * @returns {String}
   */
  get text() {
    return this._text;
  }

  /**
   * @param {Function} callback
   * @returns {Prompt}
   */
  read(callback) {
    if (Prompt._noInteractionMode) {
      callback('');
      return this;
    }

    return this._prompt(callback);
  }

  /**
   * @param {Function} callback
   * @param {*} defaultValue
   * @returns {Prompt}
   */
  readWithDefaults(callback, defaultValue) {
    if (Prompt._noInteractionMode) {
      callback(defaultValue);
      return this;
    }

    this._text += ` [${defaultValue}]`;

    this.read((answer) => {
      callback(answer || defaultValue);
    });

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Prompt}
   */
  readHidden(callback) {
    if (Prompt._noInteractionMode) {
      callback('');
      return this;
    }

    return this._promptHidden(callback);
  }

  /**
   * @param {Function} callback
   * @returns {Prompt}
   */
  readConfirm(callback) {
    if (Prompt._noInteractionMode) {
      callback(!Prompt._deepConfirmationRefuse);
      return this;
    }

    return this.readChoice((result) => {
      callback(result === 'y');
    }, ['Y', 'N']);
  }

  /**
   * @param {Function} callback
   * @param {String[]} choices
   * @param {Boolean} castToLower
   * @returns {Prompt}
   */
  readChoice(callback, choices, castToLower = true) {
    if (Prompt._noInteractionMode) {
      callback(choices.length > 0 ? choices[0] : '');
      return this;
    }

    let appendText = choices.join(', ');

    if (choices.length === 2) {
      appendText = `${choices[0]}/${choices[1]}`;
    }

    this._text += ` (${appendText})`;

    choices = choices.map((str) => str.toLowerCase());

    let resultCb = (cb, result) => {
      result = castToLower ? result.toLowerCase() : result;

      if (choices.indexOf(result) === -1) {
        this._prompt(cb.bind(this, cb), Prompt._choicesError(choices));

        return;
      }

      callback(result);
    };

    return this.read(resultCb.bind(this, resultCb));
  }

  /**
   * @param {Function} onResultCallback
   * @param {String} text
   * @returns {Prompt}
   * @private
   */
  _promptHidden(onResultCallback, text = null) {
    text = `${text || this._text}: `;

    let rl = Prompt._createReadlineInterface(this._syncMode);

    if (this._syncMode) {
      rl.questionHidden(text, (answer) => {
        onResultCallback((answer || '').trim());
      });

      return this;
    }

    let stdin = process.openStdin();

    process.stdin.on('data', (char) => {
      char = char.toString();

      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.pause();
          break;
        default:
          process.stdout.write(
            `${Prompt._oct(33)}[2K${Prompt._oct(33)}[200D${text}${new Array(rl.line.length + 1).join('*')}`
          );
          break;
      }
    });

    return this._trigger(
      rl,
      text,
      onResultCallback
    );
  }

  /**
   * @param {Number} num
   * @returns {Number}
   * @private
   */
  static _oct(num) {
    return parseInt(`0${num}`, 8);
  }

  /**
   * @param {Function} onResultCallback
   * @param {String} text
   * @returns {Prompt}
   * @private
   */
  _prompt(onResultCallback, text = null) {
    return this._trigger(
      Prompt._createReadlineInterface(this._syncMode),
      `${text || this._text}: `,
      onResultCallback
    );
  }

  /**
   * @param {Object} readlineInterface
   * @param {String} text
   * @param {Function} onResultCallback
   * @param {String} type
   * @returns {Prompt}
   * @private
   */
  _trigger(readlineInterface, text, onResultCallback, type = 'question') {
    readlineInterface[type](text, (answer) => {
      readlineInterface.close();

      onResultCallback((answer || '').trim());
    });

    return this;
  }

  /**
   * @param {Boolean} sync
   * @returns {Object}
   * @private
   */
  static _createReadlineInterface(sync = false) {
    return (sync ? ReadlineSync : readline).createInterface({
      input: process.stdin,
      output: process.stdout,
      historySize: 0,
    });
  }

  /**
   * @param {String[]} choices
   * @returns {String}
   * @private
   */
  static _choicesError(choices) {
    return `You have to choose one of the following values: ${choices.join(', ')}`;
  }

  /**
   * @todo: get rid of this hook
   *
   * @returns {Boolean}
   */
  static get _noInteractionMode() {
    return process.env.hasOwnProperty('DEEP_NO_INTERACTION');
  }

  /**
   * @returns {boolean}
   * @private
   */
  static get _deepConfirmationRefuse() {
    return process.env.hasOwnProperty('DEEP_CONFIRMATION_REFUSE');
  }

}
