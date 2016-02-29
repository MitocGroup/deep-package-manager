/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {InvalidGTMContainerIdException} from './Exception/InvalidGTMContainerIdException';

export class DeployIdDriver extends AbstractDriver {
  /**
   * @param {String} deployId
   */
  constructor(deployId) {
    super();

    this._deployId = deployId;
  }

  /**
   * @returns {String}
   */
  get deployId() {
    return this._deployId;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let scriptContent = DeployIdDriver.SCRIPT_TPL.replace(/\{deployId\}/g, this._deployId);

    return this.replaceTags(
      htmlContent,
      DeployIdDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'deployId';
  }

  /**
   * @returns {String}
   */
  static get SCRIPT_TPL() {
    return `<meta name="deep-deploy-id" content="{deployId}"/>`;
  }
}