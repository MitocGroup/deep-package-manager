/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {ExecException} from '../../Exception/ExecException';
import {AbstractCompiler} from './AbstractCompiler';
import StringUtils from 'underscore.string';
import {Action} from '../../Microservice/Metadata/Action';
import exec from 'sync-exec';
import Path from 'path';

/**
 * Compiler dependencies using NPM package manager
 */
export class NodePackageManagerCompiler extends AbstractCompiler {
  /**
   * Compile an microservice dependencies recursively
   *
   * @param {Instance} microservice
   */
  static compile(microservice) {
    console.log(`${new Date().toTimeString()} Compile ${microservice.identifier} microservice`);
    NodePackageManagerCompiler._compileBackend(microservice.autoload.backend, microservice.resources.actions);
  }

  /**
   * Compiles backend
   *
   * @param {String} backendPath
   * @param {Action[]} actions
   */
  static _compileBackend(backendPath, actions) {
    for (let action of actions) {
      if (action.type === Action.LAMBDA) {
        console.log(`${new Date().toTimeString()} Compile ${action.source} lambda`);
        let source = StringUtils.trim(action.source, '/');
        source = `${backendPath}/${source}`;

        NodePackageManagerCompiler._triggerNpmInstall(source);
      }
    }
  }

  /**
   * @param {String} source
   */
  static _triggerNpmInstall(source) {
    let npm = NodePackageManagerCompiler._locateNpm();

    if (!npm) {
      throw new ExecException(1, 'Unable to locate npm executable.');
    }

    exec(`rm -rf ./node_modules`, {cwd: source});

    let npmPath = Path.dirname(npm);
    let nodePath = Path.dirname(process.execPath);

    let result = exec(`PATH="$PATH:${npmPath}:${nodePath}" ${npm} install`, {cwd: source, env: process.env});

    if (result.status !== 0) {
      throw new ExecException(result.status, result.stderr);
    }
  }

  /**
   * @returns {String}
   * @private
   */
  static _locateNpm() {
    let result = exec('which npm');

    if (result.status === 0) {
      return StringUtils.trim(result.stdout);
    }

    let bindDir = Path.dirname(process.title);
    result = exec(`which ${bindDir}/npm`);

    if (result.status === 0) {
      return StringUtils.trim(result.stdout);
    }
  }
}
