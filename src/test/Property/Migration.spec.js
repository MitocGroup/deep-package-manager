'use strict';

import chai from 'chai';
import path from 'path';
import {Migration} from '../../lib/Property/Migration';
import {Hash} from '../../lib/Helpers/Hash';

suite('Property/Migration', function() {
  let testMigrationVersion = '1111111111';
  let migrationFile = path.join(__dirname, 'sampleMigration', `Version${testMigrationVersion}.js`);

  let registry = function() {
    let _db = [];

    return {
      ensure: (version, onMissingDb) => {
        if (_db.indexOf(version) === -1) {
          onMissingDb();
          return true;
        }

        return false;
      },
      remove: (version) => {
        let i = _db.indexOf(version);

        if (i !== -1) {
          _db.splice(i, 1);
        }
      }
    };
  };

  let ts = new Date().getTime();
  let name = `Version${ts}`;
  let versionPrefix = 'ms.identifier';

  function createMigration(hasVersionPrefix = true) {
    let migration = new Migration(name, migrationFile, hasVersionPrefix ? versionPrefix : null);
    migration.registry = new registry();

    return migration;
  }

  let migration = createMigration();

  test('Class Migration exists in Property/Migration', function() {
    chai.expect(typeof Migration).to.equal('function');
  });

  test('Check Migration.name getter', () => {
    chai.expect(migration.name).to.equal(name);
  });

  test('Check Migration.migrationPath getter', () => {
    chai.expect(migration.migrationPath).to.equal(migrationFile);
  });

  test('Check Migration.version getter (with prefix)', () => {
    chai.expect(migration.version).to.equal(`${versionPrefix}_${ts}`);
  });

  test('Check Migration.version getter (without prefix)', () => {
    let migrationNoPrefix = createMigration(false);

    chai.expect(migrationNoPrefix.version).to.equal(ts.toString());
  });

  test('Check Migration.migration getter', () => {
    let migrationObj = migration.migration;

    chai.expect(typeof migrationObj).to.equal('object');
    chai.expect(migrationObj).to.have.property('up');
    chai.expect(migrationObj).to.have.property('down');
  });

  test('Check Migration.create()', () => {
    let migrationsDir = path.dirname(migrationFile);
    let migrationHash = Hash.md5(migrationsDir);
    let migrations = Migration.create(migrationsDir);

    chai.expect(migrations).to.have.length(1);

    let migration1 = migrations[0];

    chai.expect(migration1.name).to.equal(path.basename(migrationFile, '.js'));
    chai.expect(migration1.version).to.equal(`${migrationHash}_${testMigrationVersion}`);
    chai.expect(migration1.migrationPath).to.equal(migrationFile);
  });
});
