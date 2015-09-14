/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

//import {NodePackageManagerCompiler} from './Driver/NodePackageManagerCompiler';
import {Action} from '../Microservice/Metadata/Action';
import StringUtils from 'underscore.string';

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
    for (let compiler of Compiler.compilers) {
      compiler.compile(microservice);
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
    let lambdas = {};

    for (let action of microservice.resources.actions) {
      if (action.type === Action.LAMBDA) {
        let source = StringUtils.trim(action.source, '/');

        lambdas[action.identifier] = `${backendPath}/${source}`;
      }
    }

    return lambdas;
  }

  /**
   * Retrieve available compilers
   * @todo: do we need NPM compiler anymore?
   *
   * @returns {Array}
   */
  static get compilers() {
    return [/*NodePackageManagerCompiler*/];
  }
}
