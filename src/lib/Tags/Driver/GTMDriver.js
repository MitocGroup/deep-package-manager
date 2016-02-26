/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {InvalidGTMContainerIdException} from './Exception/InvalidGTMContainerIdException';

export class GTMDriver extends AbstractDriver {
  /**
   * @param {String} containerId
   */
  constructor(containerId) {
    super();

    this._containerId = containerId;

    this._validateContainerId();
  }

  /**
   * @private
   */
  _validateContainerId() {
    if (!/^GTM\-[A-Z0-9]+$/i.test(this._containerId)) {
      throw new InvalidGTMContainerIdException(this._containerId);
    }
  }

  /**
   * @returns {String}
   */
  get containerId() {
    return this._containerId;
  }

  /**
   * @param {String} htmlContent
   * @returns {String}
   */
  inject(htmlContent) {
    let scriptContent = GTMDriver.SCRIPT_TPL.replace(/\{containerId\}/g, this._containerId);

    return this.replaceTags(
      htmlContent,
      GTMDriver.TAG_SUFFIX,
      scriptContent
    );
  }

  /**
   * @returns {String}
   */
  static get TAG_SUFFIX() {
    return 'gtm';
  }

  /**
   * @returns {String}
   */
  static get SCRIPT_TPL() {
    return `<!-- Google Tag Manager -->
<noscript><iframe src="//www.googletagmanager.com/ns.html?id={containerId}"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'//www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','{containerId}');</script>
<!-- End Google Tag Manager -->`;
  }
}
