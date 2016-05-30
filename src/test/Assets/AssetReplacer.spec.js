'use strict';

import chai from 'chai';
import {AssetReplacer} from '../../lib/Assets/AssetReplacer';
import {UrlReplacer} from '../../lib/Assets/Replacer/UrlReplacer';
import {AbstractReplacerMock} from '../mock/Assets/Replacer/AbstractReplacerMock'
import {AbstractReplacer} from '../../lib/Assets/Replacer/AbstractReplacer';
import fsExtra from 'fs-extra';

suite('Assets/AssetReplacer', () => {
  let version = 'test_version';
  let assetReplacer = new AssetReplacer(version);

  test('Class AssetReplacer exists in Assets/AssetReplacer', () => {
    chai.expect(AssetReplacer).to.be.an('function');
  });

  test('Check constructor sets version', () => {
    chai.expect(assetReplacer.version).to.equal(version);
  });

  test('Check constructor sets _replacers to []', () => {
    chai.expect(assetReplacer.replacers).to.eql([]);
  });

  test('Check _getExtension() method returns "json"', () => {
    let file = './test/testMaterials/Property1/deeploy.test.json';
    let expectedResult = 'json';

    let actualResult = AssetReplacer._getExtension(file);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _getExtension() method returns ""', () => {
    let actualResult = AssetReplacer._getExtension('');

    chai.expect(actualResult).to.eql('');
  });

  test('Check _ucFirst() method returns "ToUpperCaseFirstChar"', () => {
    let str = 'toUpperCaseFirstChar';
    let expectedResult = 'ToUpperCaseFirstChar';

    let actualResult = AssetReplacer._ucFirst(str);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _ucFirst() method returns "ToUpperCaseFirstChar"', () => {
    let str = 'ToUpperCaseFirstChar';
    let expectedResult = 'ToUpperCaseFirstChar';

    let actualResult = AssetReplacer._ucFirst(str);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check addReplacer(replacer) for typeof replacer === string', () => {
    let replacer = 'url';

    assetReplacer.addReplacer(replacer);
    let actualResult = assetReplacer.replacers.pop();

    chai.expect(actualResult).to.be.an.instanceof(UrlReplacer);
    chai.expect(actualResult.version).to.contains(assetReplacer.version);
  });

  test('Check addReplacer(replacer) for typeof replacer !== string', () => {
    let testVersion = 'replacer_test_version';
    let replacer = new UrlReplacer(testVersion);

    assetReplacer.addReplacer(replacer);

    let actualResult = assetReplacer.replacers.pop();
    chai.expect(actualResult).to.be.an.instanceof(UrlReplacer);
    chai.expect(actualResult.version).to.contains(testVersion);
  });

  test('Check create() returns valid instance of AssetReplacer', () => {
    let testVersion = 'abstract_replacer_test_version';
    let replacer = new AbstractReplacerMock(testVersion);

    let actualResult = AssetReplacer.create(version, 'url', replacer);

    let abstractReplacer = actualResult.replacers.pop();
    chai.expect(abstractReplacer).to.be.an.instanceof(AbstractReplacer);
    chai.expect(abstractReplacer.version).to.contains(testVersion);

    let urlReplacer = actualResult.replacers.pop();
    chai.expect(urlReplacer).to.be.an.instanceof(UrlReplacer);
    chai.expect(urlReplacer.version).to.contains(version);
  });

  test('Check replace() returns valid istance AssetReplace', () => {
    //arrange
    let rawCssFilePath = './test/testMaterials/assets/rawFiles/data.css';
    let rawHtmlFilePath = './test/testMaterials/assets/rawFiles/data.html';
    let testCssFilePath = './test/testMaterials/assets/testFiles/data.css';
    let testHtmlFilePath = './test/testMaterials/assets/testFiles/data.html';

    fsExtra.copySync(rawCssFilePath, testCssFilePath);
    fsExtra.copySync(rawHtmlFilePath, testHtmlFilePath);

    let expectedCssResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/data.css', 'utf8');
    let expectedHtmlResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/data.html', 'utf8');

    let testVersion = 'replaced_version';
    let replacer = new UrlReplacer(testVersion);

    assetReplacer.addReplacer(replacer);

    //act
    let actualResult = assetReplacer.replace(testCssFilePath, testHtmlFilePath);

    //asserts
    let actualCssResult = fsExtra.readFileSync(testCssFilePath, 'utf8');
    let actualHtmlResult = fsExtra.readFileSync(testHtmlFilePath, 'utf8');

    chai.expect(actualCssResult).to.eql(expectedCssResult);
    chai.expect(actualHtmlResult).to.eql(expectedHtmlResult);

    //remove temp test files
    fsExtra.removeSync('./test/testMaterials/assets/testFiles');
  });
});
