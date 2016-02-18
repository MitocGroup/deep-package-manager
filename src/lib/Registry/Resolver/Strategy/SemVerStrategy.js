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
    let availableVersions = moduleDb.getVersions().sort(semver.rcompare);

    for (let i in availableVersions) {
      if (!availableVersions.hasOwnProperty(i)) {
        continue;
      }

      let versionToMatch = semver.clean(availableVersions[i]);

      if (semver.satisfies(versionToMatch, version)) {
        return versionToMatch;
      }
    }

    return null;
  }
}
