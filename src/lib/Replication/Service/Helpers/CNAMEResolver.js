/**
 * Created by CCristi on 3/21/17.
 */

'use strict';

import {Prompt} from '../../../Helpers/Terminal/Prompt';
import {MissingCNAMEException} from '../../Exception/MissingCNAMEException';

export class CNAMEResolver {
  /**
   * @param {String[]} cNames
   */
  constructor(cNames) {
    if (!cNames || cNames.length === 0) {
      throw new MissingCNAMEException();
    }

    this._cNames = cNames;
    this._resolvedHostname = null;
  }

  /**
   * @returns {String}
   */
  resolveHostname() {
    if (!this._resolvedHostname) {
      this._resolvedHostname = this._resolveLongest() || this._askForCName();
    }

    return this._resolvedHostname;
  }

  /**
   * @returns {String}
   */
  resolveDomain() {
    let hostParts = this.resolveHostname().split('.');

    return hostParts.slice(1).join('.');
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
    let prompt = new Prompt('Choose the CNAME to be used');
    let chosenCName = null;

    prompt.syncMode = true;

    prompt.readChoice(cName => {
      chosenCName = cName;
    }, this._cNames);

    return chosenCName;
  }
}
