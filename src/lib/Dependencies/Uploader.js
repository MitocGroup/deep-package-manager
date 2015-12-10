/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {WaitFor} from '../Helpers/WaitFor';
import {Dispatcher} from './Dispatcher';
import {Lambda} from '../Property/Lambda';


/**
 * Dependencies uploader
 */
export class Uploader extends Dispatcher {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    super(driver);
  }

  /**
   * @param {Microservice} microservice
   * @param {Function} callback
   */
  dispatch(microservice, callback) {
    microservice.compile(true);
    let lambdas = microservice.config.lambdas;

    let wait = new WaitFor();
    let remaining = 0;

    for (let lambdaIdentifier in lambdas) {
      if (!lambdas.hasOwnProperty(lambdaIdentifier)) {
        continue;
      }

      let lambdaPath = lambdas[lambdaIdentifier];

      remaining++;

      Lambda.createPackage(lambdaPath).ready(() => {
        remaining--;
      });
    }

    wait.push(() => {
      return remaining <= 0;
    });

    wait.ready(() => {
      this._driver.push(
        microservice.basePath,
        microservice.identifier,
        microservice.version,
        callback
      );
    });
  }
}