'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {S3StdDriver} from '../../../lib/Dependencies/Driver/S3StdDriver';
import {Exception} from '../../../lib/Exception/Exception';
import awsS3Mock from '../../mock/AWS/awsS3Mock';
import {S3Mock} from '../../mock/AWS/S3Mock';
import {FileWalker} from '../../../lib/Helpers/FileWalker';
import FileSystem from 'fs';

chai.use(sinonChai);

suite('Dependencies/Driver/S3StdDriver', function() {
  let bucketName = 'testbucketName123';
  let dependencyName = 'test/testMaterials/testPack/dependencyName';
  let dependencyVersion = 'v0.0.1';
  let inputPath = 'test/testMaterials/Property4';
  let s3StdDriver = new S3StdDriver(awsS3Mock, bucketName);
  let archivePath = 'test/testMaterials/testPack/dependencyName-v0.0.1.tar.gz';

  test('Class S3StdDriver exists in Dependencies/Driver/S3StdDriver', function() {
    chai.expect(typeof S3StdDriver).to.equal('function');
  });

  test('Check constructor sets valid value for _bucket', function() {
    chai.expect(s3StdDriver.bucket).to.be.equal(bucketName);
  });

  test('Check constructor sets valid value for _s3', function() {
    chai.expect(typeof s3StdDriver._s3).to.be.equal('object');
    chai.expect(s3StdDriver._s3).to.be.an.instanceOf(S3Mock);
  });

  test('Check pull() method for _dryRun', function() {
    let spyCallback = sinon.spy();
    s3StdDriver.dryRun = true;

    let actualResult = s3StdDriver.pull(dependencyName, dependencyVersion, spyCallback);

    chai.expect(actualResult).to.equal(undefined);
    chai.expect(spyCallback).to.have.been.calledWithExactly();
  });


  test('Check push() method _dryRun', function() {
    s3StdDriver.dryRun = true;
    let callback = (path) => {
      let stats = FileSystem.statSync(s3StdDriver._getArchivePath(dependencyName, dependencyVersion));
      chai.expect(stats.isFile()).to.equal(true);
      chai.expect(actualResult).to.equal(undefined);

      // complete the async
      done();
    };

    let actualResult = s3StdDriver.push(inputPath, dependencyName, dependencyVersion, callback);
  });

  //@todo - unable to write to outputstream -> TypeError: Invalid non-string/buffer chunk
  //test('Check pull() method for !_dryRun throw exception', function() {
  //  let spyCallback = sinon.spy();
  //  let error = null;
  //  s3StdDriver.dryRun = false;
  //
  //  s3StdDriver._s3.setMode(S3Mock.FAILURE_MODE);
  //
  //  try {
  //    s3StdDriver.pull(dependencyName, dependencyVersion, spyCallback);
  //  } catch (e) {
  //    error = e;
  //  }
  //
  //  chai.expect(error).to.be.an.instanceOf(Exception);
  //  chai.expect(spyCallback).to.not.have.been.calledWith();
  //});

  ////create archive
  //test('Check pack() method', function(done) {
  //  let callback = (path) => {
  //    console.log('done paccking in: ', path);
  //    let stats = FileSystem.statSync(path);
  //    chai.expect(stats.isFile()).to.equal(true);
  //
  //    // complete the async
  //    done();
  //  };
  //
  //  s3StdDriver._pack(inputPath, archivePath, callback);
  //});

  //test('Check pull() method for !_dryRun', function(done) {
  //
  //  s3StdDriver.dryRun = false;
  //  let actualResult = null;
  //
  //  let callback = (path) => {
  //    console.log('IN CB DONE ', path);
  //    let stats = FileSystem.statSync(outputPath);
  //    chai.expect(stats.isDirectory()).to.be.equal(true);
  //
  //    actualResult = fileWalker.walk(outputPath);
  //    chai.expect(actualResult).to.eql(expectedResult);
  //
  //    //complete the async
  //    done();
  //  };
  //
  //  s3StdDriver._s3.setMode(S3Mock.DATA_MODE);
  //
  //  s3StdDriver.pull(dependencyName, dependencyVersion, callback);
  //
  //});
});


