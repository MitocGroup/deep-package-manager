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
    let availableVersions = moduleDb.getVersions();

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
