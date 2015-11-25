'use strict';

import chai from 'chai';
import {AssetReplacer} from '../../lib.compiled/Assets/AssetReplacer';
import {UrlReplacer} from '../../lib.compiled/Assets/Replacer/UrlReplacer';
import {AbstractReplacerMock} from '../mock/Assets/Replacer/AbstractReplacerMock'
import {AbstractReplacer} from '../../lib.compiled/Assets/Replacer/AbstractReplacer';
import fs from 'fs';

suite('Assets/AssetReplacer', function() {
  let version = 'test_version';
  let assetReplacer = new AssetReplacer(version);

  test('Class AssetReplacer exists in Assets/AssetReplacer', function() {
    chai.expect(typeof AssetReplacer).to.equal('function');
  });

  test('Check constructor sets version', function() {
    chai.expect(assetReplacer.version).to.equal(version);
  });

  test('Check constructor sets _replacers to []', function() {
    chai.expect(assetReplacer.replacers).to.eql([]);
  });

  test('Check _getExtension() method returns "json"', function() {
    let file = './test/testMaterials/Property1/deeploy.test.json';
    let expectedResult = 'json';

    let actualResult = AssetReplacer._getExtension(file);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _getExtension() method returns ""', function() {
    let actualResult = AssetReplacer._getExtension();

    chai.expect(actualResult).to.eql('');
  });

  test('Check _ucFirst() method returns "ToUpperCaseFirstChar"', function() {
    let str = 'toUpperCaseFirstChar';
    let expectedResult = 'ToUpperCaseFirstChar';

    let actualResult = AssetReplacer._ucFirst(str);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _ucFirst() method returns "ToUpperCaseFirstChar"', function() {
    let str = 'ToUpperCaseFirstChar';
    let expectedResult = 'ToUpperCaseFirstChar';

    let actualResult = AssetReplacer._ucFirst(str);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check addReplacer(replacer) for typeof replacer === string', function() {
    let replacer = 'url';

    assetReplacer.addReplacer(replacer);
    let actualResult = assetReplacer.replacers.pop();

    chai.expect(actualResult).to.be.an.instanceof(UrlReplacer);
    chai.expect(actualResult.version).to.contains(assetReplacer.version);
  });

  test('Check addReplacer(replacer) for typeof replacer !== string', function() {
    let testVersion = 'replacer_test_version';
    let replacer = new UrlReplacer(testVersion);

    assetReplacer.addReplacer(replacer);

    let actualResult = assetReplacer.replacers.pop();
    chai.expect(actualResult).to.be.an.instanceof(UrlReplacer);
    chai.expect(actualResult.version).to.contains(testVersion);
  });

  test('Check create() returns valid instance of AssetReplacer', function() {
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

  test('Check replace() returns valid istance AssetReplace', function() {
    //arrange
    let cssContent = '@font-face { font-family: "Bitstream Vera Serif Bold";' +
      'src: url("VeraSeBd.ttf");} body { background-image: url(images/foo.png);}';
    let htmlContent = '<body>' +
      '<img src="../foo.jpg">' +
      '<p>hi</p>' +
      '<script src="scripts/x.js"></script>' +
      '<script src="scripts/y.js"></script>' +
      '<link rel=stylesheet href="/styles/thing.css">' +
      '</body>';
    let expectedCssResult = '@font-face { font-family: "Bitstream Vera Serif Bold";' +
      'src: url("VeraSeBd.ttf?replaced_version");} ' +
      'body { background-image: url(images/foo.png?replaced_version);}';
    let expectedHtmlResult = '<body><img src="../foo.jpg?replaced_version"><p>hi</p>' +
      '<script src="scripts/x.js?replaced_version"></script>' +
      '<script src="scripts/y.js?replaced_version"></script>' +
      '<link rel=stylesheet href="/styles/thing.css?replaced_version"></body>';
    let cssFile = './test/testMaterials/assets/test.css';
    let htmlFile = './test/testMaterials/assets/test.html';
    let testVersion = 'replaced_version';
    let replacer = new UrlReplacer(testVersion);
    fs.writeFileSync(cssFile, cssContent);
    fs.writeFileSync(htmlFile, htmlContent);
    assetReplacer.addReplacer(replacer);

    //act
    let actualResult = assetReplacer.replace(cssFile, htmlFile);

    //asserts
    let actualCssResult = fs.readFileSync(cssFile, 'utf8');
    let actualHtmlResult = fs.readFileSync(htmlFile, 'utf8');

    chai.expect(actualCssResult).to.eql(expectedCssResult);
    chai.expect(actualHtmlResult).to.eql(expectedHtmlResult);
  });
});
