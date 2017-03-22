/**
 * Created by CCristi on 3/21/17.
 */

'use strict';

import {Prompt} from '../../../Helpers/Terminal/Prompt';

export class CNAMEResolver {
  /**
   * @param {String[]} cNames
   */
  constructor(cNames) {
    this._cNames = cNames;
  }

  /**
   * @returns {String}
   */
  resolve() {
    return this._resolveLongest() || this._askForCName();
  }

  /**
   * @returns {String|null}
   * @private
   */
  _resolveLongest() {
    let longestCName = this._cNames.reduce((lCname, cName) => {
      return lCname.length > cName.length ? lCname : cName;
    });

    let cloneCNames = [].concat(this._cNames).filter(cName => cName !== longestCName);
    let isSuitable = true;

    cloneCNames.forEach(cName => {
      if (longestCName.indexOf(cName) === -1) {
        isSuitable = false;
      }
    });

    return isSuitable ? longestCName : null;
  }

  /**
   * @returns {String}
   * @private
   */
  _askForCName() {
    let prompt = new Prompt('Choose the AWS profile to be used');
    let chosenCName = null;

    prompt.syncMode = true;

    prompt.readChoice(cName => {
      chosenCName = cName;
    }, this._cNames);

    return chosenCName;
  }
}
