'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {DeployIdInjector} from '../../lib/Assets/DeployIdInjector';
import fsExtra from 'fs-extra';

suite('Assets/DeployIdInjector', () => {
  let path = './test/testMaterials/assets/testFiles';
  let deployId = 'test_deploy_ID';
  let deployIdInjector = new DeployIdInjector(path, deployId);

  let rawCssFilePath = './test/testMaterials/assets/rawFiles/data.css';
  let rawHtmlFilePath = './test/testMaterials/assets/rawFiles/data.html';
  let testCssFilePath = './test/testMaterials/assets/testFiles/data.css';
  let testHtmlFilePath = './test/testMaterials/assets/testFiles/data.html';

  test('Class DeployIdInjector exists in Assets/DeployIdInjector', () => {
    chai.expect(typeof DeployIdInjector).to.equal('function');
  });

  test('Check constructor sets _path', () => {
    chai.expect(deployIdInjector.path).to.equal(path);
  });

  test('Check constructor sets _deployId', () => {
    chai.expect(deployIdInjector.deployId).to.equal(deployId);
  });

  test('Check constructor sets _versionedExtensions', () => {
    chai.expect(deployIdInjector.versionedExtensions).to.eql(
      DeployIdInjector.DEFAULT_VERSIONED_EXTENSIONS
    );
  });

  test('Check versionedExtensions setter', () => {
    let versionedExtensions = ['css', 'html', 'xhtml'];

    deployIdInjector.versionedExtensions = versionedExtensions;

    chai.expect(deployIdInjector.versionedExtensions).to.eql(versionedExtensions);
  });

  test('Check IGNORE_FILE getter returns ".deepinjectignore"', () => {
    chai.expect(DeployIdInjector.IGNORE_FILE).to.equal('.deepinjectignore');
  });

  test('Check _findAssets() returns ', () => {
    fsExtra.copySync(rawCssFilePath, testCssFilePath);
    fsExtra.copySync(rawHtmlFilePath, testHtmlFilePath);

    let expectedResult = [
      'test/testMaterials/assets/testFiles/data.css',
      'test/testMaterials/assets/testFiles/data.html',
    ];

    chai.expect(deployIdInjector._findAssets()).to.eql(expectedResult);
  });

  test('Check prepare() executes successfully', () => {
    //arrange
    let spyCallback = sinon.spy();

    let expectedCssResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/dataWithDeployId.css', 'utf8');
    let expectedHtmlResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/dataWithDeployId.html', 'utf8');

    //act
    deployIdInjector.prepare(spyCallback);

    //asserts
    let actualCssResult = fsExtra.readFileSync(testCssFilePath, 'utf8');
    let actualHtmlResult = fsExtra.readFileSync(testHtmlFilePath, 'utf8');

    chai.expect(spyCallback).to.have.been.calledWithExactly(null);
    chai.expect(actualCssResult).to.eql(expectedCssResult);
    chai.expect(actualHtmlResult).to.eql(expectedHtmlResult);


  });

  test('Check prepare() executes with error', () => {
    let spyCallback = sinon.spy();
    let invalidFilePath = './test/testMaterials/assets/testFiles/test.xhtml';

    fsExtra.createFileSync(invalidFilePath);

    let actualResult = deployIdInjector.prepare(spyCallback);

    chai.expect(spyCallback).to.have.been.calledWith();

    let error = spyCallback.args[0][0];

    chai.expect(error).to.equal(null);

    //remove temp test files
    fsExtra.removeSync('./test/testMaterials/assets/testFiles');
  });
});
