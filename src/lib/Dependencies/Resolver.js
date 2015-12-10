/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

import {WaitFor} from '../Helpers/WaitFor';
import {Instance as Microservice} from '../Microservice/Instance';
//import {InfiniteRecursionException} from './Exception/InfiniteRecursionException';
import {Dispatcher} from './Dispatcher';

/**
 * Dependencies resolver
 */
export class Resolver extends Dispatcher {
  /**
   * @param {AbstractDriver} driver
   */
  constructor(driver) {
    super(driver);

    this._resolveStack = [];
  }

  /**
   * @param {Microservice} microservice
   * @param {Function} callback
   */
  dispatch(microservice, callback) {
    this._pull(microservice.config.dependencies, (pulledDependencies) => {
      let wait = new WaitFor();
      let stackSize = 0;

      pulledDependencies.forEach((dependencyPath) => {
        stackSize++;

        this.dispatch(Microservice.create(dependencyPath), () => {
          stackSize--;
        });
      });

      wait.push(() => {
        return stackSize <= 0;
      });

      wait.ready(() => {
        callback();
      });
    });
  }

  /**
   * @param {Object} dependencies
   * @param {Function} callback
   */
  _pull(dependencies, callback) {
    let wait = new WaitFor();
    let stackSize = 0;
    let pulledDependencies = [];

    for (let dependencyName in dependencies) {
      if (!dependencies.hasOwnProperty(dependencyName)) {
        continue;
      }

      let dependencyVersion = dependencies[dependencyName];

      if (this._resolveStack.indexOf(dependencyName) !== -1) {
        //throw new InfiniteRecursionException(dependencyName, dependencyVersion);
        continue;
      }

      stackSize++;
      this._resolveStack.push(dependencyName);

      this._driver.pull(dependencyName, dependencyVersion, (outputPath) => {
        pulledDependencies.push(outputPath);

        stackSize--;
      });
    }

    wait.push(() => {
      return stackSize <= 0;
    });

    wait.ready(() => {
      callback(pulledDependencies);
    });
  }
}