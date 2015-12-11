/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from '../Microservice/Metadata/Action';
import StringUtils from 'underscore.string';
import {_extend as extend} from 'util';

/**
 * Compiles a microservice
 */
export class Compiler {
  /**
   * Compile dependencies recursively
   *
   * @param {Microservice} microservice
   * @returns {Compiler}
   */
  static compile(microservice) {
    for (let i in Compiler.compilers) {
      if (!Compiler.compilers.hasOwnProperty(i)) {
        continue;
      }

      Compiler.compilers[i].compile(microservice);
    }

    return this;
  }

  /**
   * @param microservice
   * @returns {Object}
   */
  static buildLambdas(microservice)
  {
    let backendPath = microservice.autoload.backend;
    let actionsObj = microservice.resources.actions;
    let lambdas = {
      _: {}, // @todo: move config somewhere...
    };

    for (let i in actionsObj) {
      if (!actionsObj.hasOwnProperty(i)) {
        continue;
      }

      let action = actionsObj[i];

      if (action.type === Action.LAMBDA) {
        let source = StringUtils.trim(action.source, '/');

        lambdas[action.identifier] = `${backendPath}/${source}`;
        lambdas._[action.identifier] = extend({}, action.engine);
        lambdas._[action.identifier].forceUserIdentity = action.forceUserIdentity;
      }
    }

    return lambdas;
  }

  /**
   * Retrieve available compilers
   *
   * @returns {Function[]}
   */
  static get compilers() {
    return [];
  }
}
