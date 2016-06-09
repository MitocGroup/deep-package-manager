/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';

export class DeepConfigDriver extends AbstractDriver {
  /**
   * @param {Object} config
   */
  constructor(config) {
    super();

    this._config = config;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let scriptContent = DeepConfigDriver.SCRIPT_TPL.replace(/\{plainConfig\}/g, JSON.stringify(this._config));

    return this.replaceTags(
      htmlContent,
      DeepConfigDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'config';
  }

  /**
   * @returns {String}
   */
  static get DEEP_CFG_VAR() {
    return '__DEEP_CFG__';
  }

  /**
   * @returns {*}
   * @constructor
   */
  static get SCRIPT_TPL() {
    return `
<!-- DEEP config (inline _config.json) -->
<script>window.${DeepConfigDriver.DEEP_CFG_VAR} = window.${DeepConfigDriver.DEEP_CFG_VAR} || {plainConfig};</script>
<!-- END DEEP config (inline _config.json) -->`;
  }
}
