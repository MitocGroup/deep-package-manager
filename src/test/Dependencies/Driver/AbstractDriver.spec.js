'use strict';

import chai from 'chai';
import {AbstractDriver} from '../../../lib/Dependencies/Driver/AbstractDriver';
import {AbstractDriverMock} from '../../mock/Dependencies/Driver/AbstractDriverMock';
import {Exception} from '../../../lib/Dependencies/Exception/Exception';
import OS from 'os';
import Path from 'path';
import {Hash} from '../../../lib/Helpers/Hash';
import domain from 'domain';

suite('Dependencies/Driver/AbstractDriver', function() {
  let abstractDriver = new AbstractDriverMock();
  let dryRunInput = true;
  let prefixInput = 'prefixTest';
  let basePathInput = 'basePathTest/To';
  let identifierInput = 'identifierTest';
  let dependencyName = 'dependencyName';
  let dependencyVersion = 'v0.0.1';
  let inputPath = 'test/testMaterials/Property4';
  let archivePath = 'test/testMaterials/testPack/archiveFileName.tar.gz';
  let expectedResult = null;

  test('Class AbstractDriver exists in Dependencies/Driver/AbstractDriver', function() {
    chai.expect(typeof AbstractDriver).to.equal('function');
  });

  test('Check constructor sets valid value for _dryRun=false', function() {
    chai.expect(abstractDriver.dryRun).to.be.equal(false);
  });

  test('Check constructor sets valid value for _prefix=\'\'', function() {
    chai.expect(abstractDriver.prefix).to.be.equal('');
  });

  test('Check constructor sets valid value for _basePath', function() {
    chai.expect(abstractDriver.basePath).to.be.equal(process.cwd());
  });

  test('Check dryRun getter/setter gets/sets valid value', function() {
    abstractDriver.dryRun = dryRunInput;
    chai.expect(abstractDriver.dryRun).to.be.equal(dryRunInput);
  });

  test('Check prefix getter/setter gets/sets valid value', function() {
    abstractDriver.prefix = prefixInput;
    chai.expect(abstractDriver.prefix).to.be.equal(prefixInput);
  });

  test('Check basePath getter/setter gets/sets valid value', function() {
    abstractDriver.basePath = basePathInput;
    chai.expect(abstractDriver.basePath).to.be.equal(basePathInput);
    abstractDriver.basePath = process.cwd();
  });

  test('Check getTmpDir static getter returns ".tar.gz"', function() {
    chai.expect(AbstractDriver.ARCHIVE_EXTENSION).to.be.equal('.tar.gz');
  });

  test('Check getTmpDir static method returns valid value', function() {
    let time = (new Date()).getTime().toString();
    time = time.substring(0, (time.length - 3));
    expectedResult = Path.join(OS.tmpdir(), Hash.md5(identifierInput) + '-' + time);
    chai.expect(AbstractDriver.getTmpDir(identifierInput)).to.be.contains(expectedResult);
  });

  test('Check _getBasename() method returns valid path', function() {
    let dependencyName = 'dependencyName';
    let dependencyVersion = 'v0.0.1';
    let actualResult = abstractDriver._getBasename(dependencyName, dependencyVersion);

    chai.expect(actualResult).to.be.equal(
      `${dependencyName}-${dependencyVersion}${AbstractDriverMock.ARCHIVE_EXTENSION}`
    );
  });

  test('Check _getPrefixedBasename() method returns valid path', function() {
    let actualResult = abstractDriver._getPrefixedBasename(dependencyName, dependencyVersion);

    chai.expect(actualResult).to.be.equal(
      `${prefixInput}/${dependencyName}-${dependencyVersion}${AbstractDriverMock.ARCHIVE_EXTENSION}`
    );
  });

  test('Check _getFolderPath() method returns valid path !prefixed', function() {
    let actualResult = abstractDriver._getFolderPath(dependencyName, dependencyVersion);

    chai.expect(actualResult).to.contains(`src/${dependencyName}-${dependencyVersion}`);
  });

  test('Check _getFolderPath() method returns valid path prefixed', function() {
    let actualResult = abstractDriver._getFolderPath(dependencyName, dependencyVersion, true);

    chai.expect(actualResult).to.contains(`${prefixInput}/${dependencyName}-${dependencyVersion}`);
  });

  //@todo - ask if _getArchivePath = _getFolderPath
  test('Check _getArchivePath() method returns valid path !prefixed', function() {
    let actualResult = abstractDriver._getArchivePath(dependencyName, dependencyVersion);

    chai.expect(actualResult).to.contains(`src/${dependencyName}-${dependencyVersion}`);
  });

  test('Check _getArchivePath() method returns valid path prefixed', function() {
    let actualResult = abstractDriver._getArchivePath(dependencyName, dependencyVersion, true);

    chai.expect(actualResult).to.contains(`${prefixInput}/${dependencyName}-${dependencyVersion}`);
  });

  test('Check errorCallback(descriptor) throws Exception', function() {
    let error = null;
    let actualResult = null;
    let errorDescriptor = null;

    try {
      actualResult = AbstractDriverMock.errorCallback(errorDescriptor);
      actualResult();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(Exception);
    chai.expect(error.message).to.be.an.equal(`Error while ${errorDescriptor}: undefined`);
  });

  //test('Check _pack() method throws exception for invalid input path', function(done) {
  //  let error = null;
  //  let errorDescriptor = 'reading sources';
  //
  //  let callback = () => {
  //    // complete the async
  //    done();
  //
  //    //chai.expect(error).to.be.an.instanceOf(Exception);
  //    //chai.expect(error.message).to.be.an.equal(`Error while ${errorDescriptor}: undefined`);
  //  };
  //
  //  try {
  //    abstractDriver._pack('fdsfdsfds', archivePath, callback);
  //  } catch (e) {
  //    error = e;
  //  }
  //});

  test('Check _pack() method packs folder/file successfully', function(done) {
    let callback = () => {
      // complete the async
      done();
      let stats = FileSystem.statSync(archivePath);
      chai.expect(stats.isFile()).to.be.equal(true);
    };

    abstractDriver._pack(inputPath, archivePath, callback);
  });

  //@todo - need to add check here and remove
  test('Check _unpack() method', function(done) {
    let error = null;
    let actualResult = null;
    let outputPath = null;

    let callback = () => {
      // complete the async
      done();
      chai.expect(error).to.be.equal(null);
      chai.expect(actualResult).to.be.equal(undefined);
      let stats = FileSystem.statSync(archivePath);
      chai.expect(stats.isDirectory()).to.be.equal(true);
    };

    try {
      outputPath = Path.join(
        Path.dirname(archivePath),
        Path.basename(archivePath, AbstractDriver.ARCHIVE_EXTENSION)
      );
      actualResult = abstractDriver._unpack(archivePath, callback);
    } catch (e) {
      error = e;
    }
  });
});