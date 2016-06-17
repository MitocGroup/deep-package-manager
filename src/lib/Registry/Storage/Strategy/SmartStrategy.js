/**
 * Created by CCristi on 6/14/16.
 */

'use strict';

import {GitHubStrategy} from './GitHubStrategy';
import {StdStrategy} from './StdStrategy';
import {GitHubContext} from '../../Context/GitHubContext';

export class SmartStrategy /* extends AbstractStrategy */ {
  constructor() {
    this.__cache__ = {};
    this._extend();
  }

  /**
   * @returns {SmartStrategy}
   * @private
   */
  _extend() {
    SmartStrategy.METHODS.forEach(method => {
      this[method] = (...args) => {
        let strategy = this._findSuitable(...args);

        return strategy[method](...args);
      }
    });

    return this;
  }

  /**
   * @returns {String[]}
   */
  static get METHODS() {
    return [
      'getModuleLocation', 
      'getModuleConfigLocation', 
      'getModuleBaseLocation', 
      'getDbLocation',
    ];
  }

  /**
   * @param {Context} moduleContext
   * @returns {AbstractStrategy}
   */
  _findSuitable(moduleContext) {
    let rules = [
      [
        moduleContext => moduleContext instanceof GitHubContext,
        GitHubStrategy,
      ],
      [
        () => true,
        StdStrategy,
      ],
    ];

    for (let rule of rules) {
      let matcher = rule[0];
      let StrategyProto = rule[1];

      if (matcher(moduleContext)) {
        return this.__cache__.hasOwnProperty(StrategyProto.name) ?
          this.__cache__[StrategyProto.name] :
          (this.__cache__[StrategyProto.name] = new StrategyProto());
      }
    }

    return null;
  }
}

