/**
 * Created by AlexanderC on 2/11/16.
 */

'use strict';

import fs from 'fs';
import {GTMDriver} from './Driver/GTMDriver';
import {DeepConfigDriver} from './Driver/DeepConfigDriver';
import {DeployIdDriver} from './Driver/DeployIdDriver';
import {RootAssetsDriver} from './Driver/RootAssetsDriver';
import {PageLoaderDriver} from './Driver/PageLoaderDriver';

export class Injector {
  /**
   * @param {String} htmlContent
   */
  constructor(htmlContent) {
    this._htmlContent = htmlContent;
  }

  /**
   * @param {String} htmlFile
   * @param {Object|null} deepConfig
   * @param {String|null} gtmContainerId
   * @param {Object} microservices
   * @param {String|null} pageLoader
   */
  static fileInjectAll(htmlFile, deepConfig = null, gtmContainerId = null, microservices = {}, pageLoader) {
    let drivers = [];

    if (deepConfig) {
      drivers.push(new DeepConfigDriver(deepConfig));
      drivers.push(new DeployIdDriver(deepConfig.deployId));
    }

    if (gtmContainerId) {
      drivers.push(new GTMDriver(gtmContainerId));
    }

    if (microservices) {
      drivers.push(new RootAssetsDriver(microservices));
    }

    if (drivers.length <= 0) {
      return;
    }

    if (pageLoader && microservices) {
      drivers.push(new PageLoaderDriver(pageLoader, microservices));
    }

    Injector.fileInject(htmlFile, ...drivers);
  }

  /**
   * @param {String} htmlFile
   * @param {AbstractDriver|GTMDriver|*} drivers
   */
  static fileInject(htmlFile, ...drivers) {
    let injector = new Injector(fs.readFileSync(htmlFile).toString());

    fs.writeFileSync(
      htmlFile,
      injector.inject(...drivers)
    );
  }

  /**
   * @returns {String}
   */
  get rawHtmlContent() {
    return this._htmlContent;
  }

  /**
   * @param {AbstractDriver|GTMDriver|*} drivers
   */
  inject(...drivers) {
    let htmlContent = this._htmlContent;

    drivers.forEach((driver) => {
      htmlContent = driver.inject(htmlContent);
    });

    return htmlContent;
  }
}
