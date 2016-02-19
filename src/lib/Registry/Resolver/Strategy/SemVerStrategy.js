/**
 * Created by AlexanderC on 2/4/16.
 */

'use strict';

import {AbstractStrategy} from './AbstractStrategy';
import semver from 'semver';

export class SemVerStrategy extends AbstractStrategy {
  constructor() {
    super();
  }

  /**
   * @param {ModuleDB|*} moduleDb
   * @param {String} version
   * @returns {String|null}
   */
  resolve(moduleDb, version) {

    // sort the versions descendant in order to
    // get the most fresh version matched first
    let availableVersions = moduleDb.getVersions().sort(SemVerStrategy.SORT_FUNC);

    for (let i in availableVersions) {
      if (!availableVersions.hasOwnProperty(i)) {
        continue;
      }

      let versionToMatch = SemVerStrategy.CLEAN_FUNC(availableVersions[i]);

      if (semver.satisfies(versionToMatch, version)) {
        return versionToMatch;
      }
    }

    return null;
  }

  /**
   * @returns {*|clean|Function}
   */
  static get CLEAN_FUNC() {
    return semver.clean;
  }

  /**
   * @returns {*|rcompare|Function}
   */
  static get SORT_FUNC() {
    return semver.rcompare;
  }
}
