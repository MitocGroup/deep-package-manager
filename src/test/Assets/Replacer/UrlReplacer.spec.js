'use strict';

import chai from 'chai';
import {UrlReplacer} from '../../../lib/Assets/Replacer/UrlReplacer';
import cssExpectedResult from '../../testMaterials/assets/expectedResults/content.css';
import htmlExpectedResult from '../../testMaterials/assets/expectedResults/content.html';
import fsExtra from 'fs-extra';

suite('Assets/Replacer/UrlReplacer', function() {
  let version = 'replaced_version';
  let urlReplacer = new UrlReplacer(version);

  let rawCssFilePath = './test/testMaterials/assets/rawFiles/data.css';
  let rawHtmlFilePath = './test/testMaterials/assets/rawFiles/data.html';
  let testCssFilePath = './test/testMaterials/assets/testFiles/data.css';
  let testHtmlFilePath = './test/testMaterials/assets/testFiles/data.html';

  fsExtra.copySync(rawCssFilePath, testCssFilePath);
  fsExtra.copySync(rawHtmlFilePath, testHtmlFilePath);

  let cssContent = fsExtra.readFileSync(testCssFilePath, 'utf8');
  let htmlContent = fsExtra.readFileSync(testHtmlFilePath, 'utf8');

  test('Class UrlReplacer exists in Assets/Replacer/UrlReplacer', function() {
    chai.expect(typeof UrlReplacer).to.equal('function');
  });

  test('Check constructor sets version', function() {
    chai.expect(urlReplacer.version).to.equal(version);
  });

  test('Check _getUriDelimiter() returns "&"', function() {
    let uri = 'http://host.com/p/a/t/h?query=string#hash'
    chai.expect(UrlReplacer._getUriDelimiter(uri)).to.equal('&');
  });

  test('Check _getUriDelimiter() returns "?"', function() {
    let uri = 'http://host.com/p/a/t/h/'
    chai.expect(UrlReplacer._getUriDelimiter(uri)).to.equal('?');
  });

  test('Check _replaceAll() replaces all search in string and returns result', function() {
    let testStr = 'here test - simple text test will be replaced to tesT';
    let search = 'test';
    let replace = 'teST';
    let expectedResult = 'here teST - simple text teST will be replaced to tesT';

    let actualResult = UrlReplacer._replaceAll(testStr, search, replace);

    chai.expect(actualResult).to.equal(expectedResult);
  });

  test('Check _parseHtml() returns valid object', function() {
    let actualResult = UrlReplacer._parseHtml(htmlContent);

    chai.expect(actualResult).to.eql(htmlExpectedResult);
  });

  test('Check _parseCss() and returns valid object', function() {
    let actualResult = UrlReplacer._parseCss(cssContent);

    chai.expect(actualResult).to.eql(cssExpectedResult);
  });

  test('Check _replace() calls _parseHtml() and returns valid object', function() {
    let extension = 'html';
    let expectedHtmlResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/data.html', 'utf8');

    let actualResult = urlReplacer._replace(htmlContent, extension);

    chai.expect(actualResult).to.eql(expectedHtmlResult);
  });

  test('Check _replace() calls _parseCss() and returns valid object', function() {
    let extension = 'css';
    let expectedCssResult = fsExtra.readFileSync('./test/testMaterials/assets/expectedResults/data.css', 'utf8');

    let actualResult = urlReplacer._replace(cssContent, extension);

    chai.expect(actualResult).to.eql(expectedCssResult);
  });

  test('Check _replace throws error for invalid extension', function() {
    let extension = 'xhtml';
    let error = null;

    try {
      urlReplacer._replace('', extension);
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceof(Error, 'error is instance of Error');
  });
});
