/**
 * Created by AlexanderC on 1/27/16.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

export class InvalidMigrationException extends Exception {

  /**
   * @param {Migration|*} migration
   * @param {String|Error} error
   */
  constructor(migration, error) {
    super(`Invalid migration ${migration.name} in '${migration.migrationPath}': ${error}`);
  }
}
