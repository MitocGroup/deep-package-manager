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
import {VersionDriver} from './Driver/VersionDriver';
import {FaviconDriver} from './Driver/FaviconDriver';
import {DeepEnvPlaceholderDriver} from './Driver/DeepEnvPlaceholderDriver';

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
   * @param {Object|null} pageLoader
   * @param {String|null} version
   * @param {String|null} favicon
   */
  static fileInjectAll(
    htmlFile,
    deepConfig = null, gtmContainerId = null, microservices = {},
    pageLoader = null, version = null, favicon = null,
    workingMicroserviceConfig = null) {

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

    if (pageLoader && pageLoader.src && microservices) {
      drivers.push(new PageLoaderDriver(pageLoader, microservices));
    }

    if (favicon) {
      drivers.push(new FaviconDriver(favicon, microservices));
    }

    if (version) {
      drivers.push(new VersionDriver(version));
    }

    if (workingMicroserviceConfig) {
      drivers.push(new DeepEnvPlaceholderDriver(workingMicroserviceConfig));
    }

    if (drivers.length <= 0) {
      return;
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
