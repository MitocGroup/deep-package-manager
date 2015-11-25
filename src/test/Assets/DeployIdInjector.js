'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {DeployIdInjector} from '../../lib.compiled/Assets/DeployIdInjector';
import fs from 'fs';
import fsExtra from 'fs-extra';

suite('Assets/DeployIdInjector', function() {
  let path = './test/testMaterials/assets';
  let deployId = 'test_deploy_ID';
  let deployIdInjector = new DeployIdInjector(path, deployId);

  test('Class DeployIdInjector exists in Assets/DeployIdInjector', function() {
    chai.expect(typeof DeployIdInjector).to.equal('function');
  });

  test('Check constructor sets _path', function() {
    chai.expect(deployIdInjector.path).to.equal(path);
  });

  test('Check constructor sets _deployId', function() {
    chai.expect(deployIdInjector.deployId).to.equal(deployId);
  });

  test('Check constructor sets _versionedExtensions', function() {
    chai.expect(deployIdInjector.versionedExtensions).to.eql(
      DeployIdInjector.DEFAULT_VERSIONED_EXTENSIONS
    );
  });

  test('Check versionedExtensions setter', function() {
    let versionedExtensions = ['css', 'html', 'xhtml'];

    deployIdInjector.versionedExtensions = versionedExtensions;

    chai.expect(deployIdInjector.versionedExtensions).to.eql(versionedExtensions);
  });

  test('Check IGNORE_FILE getter returns ".deepinjectignore"', function() {
    chai.expect(DeployIdInjector.IGNORE_FILE).to.equal('.deepinjectignore');
  });

  test('Check _findAssets() returns ', function() {
    let expectedResult = [
      'test/testMaterials/assets/test.css',
      'test/testMaterials/assets/test.html',
    ];

    chai.expect(deployIdInjector._findAssets()).to.eql(expectedResult);
  });


  test('Check prepare() executes successfully', function() {
    //arrange
    let spyCallback = sinon.spy();
    let cssFile = './test/testMaterials/assets/test.css';
    let htmlFile = './test/testMaterials/assets/test.html';
    let expectedCssResult = '@font-face { font-family: "Bitstream Vera Serif Bold";' +
      'src: url("VeraSeBd.ttf?replaced_version&test_deploy_ID");} ' +
      'body { background-image: url(images/foo.png?replaced_version&test_deploy_ID);}';
    let expectedHtmlResult = '<body><img src="../foo.jpg?replaced_version&test_deploy_ID">' +
      '<p>hi</p><script src="scripts/x.js?replaced_version&test_deploy_ID"></script>' +
      '<script src="scripts/y.js?replaced_version&test_deploy_ID"></script>' +
      '<link rel=stylesheet href="/styles/thing.css?replaced_version&test_deploy_ID"></body>';

    //act
    let actualResult = deployIdInjector.prepare(spyCallback);

    //asserts
    let actualCssResult = fs.readFileSync(cssFile, 'utf8');
    let actualHtmlResult = fs.readFileSync(htmlFile, 'utf8');

    chai.expect(spyCallback).to.have.been.calledWithExactly(null);
    chai.expect(actualCssResult).to.eql(expectedCssResult);
    chai.expect(actualHtmlResult).to.eql(expectedHtmlResult);
  });


  test('Check prepare() executes with error', function() {
    let spyCallback = sinon.spy();
    let invalidFilePath = './test/testMaterials/assets/test.xhtml';

    fsExtra.createFileSync(invalidFilePath);

    let actualResult = deployIdInjector.prepare(spyCallback);

    chai.expect(spyCallback).to.have.been.calledWith();
    let error = spyCallback.args[0][0];
    chai.expect(error).to.be.an.instanceof(Error, 'error is instance of Error');

    fsExtra.removeSync(invalidFilePath);
  });
});
