'use strict';

import chai from 'chai';
import {UrlReplacer} from '../../../lib.compiled/Assets/Replacer/UrlReplacer';

suite('Assets/Replacer/UrlReplacer', function() {
  let version = 'test_version';
  let urlReplacer = new UrlReplacer(version);
  let cssContent = '.test { background-image: url("test.png"); }';
  let htmlContent = '<body>' +
    '<img src="../foo.jpg">' +
    '<p>hi</p>' +
    '<script src="scripts/x.js"></script>' +
    '<script src="scripts/y.js"></script>' +
    '<link rel=stylesheet href="/styles/thing.css">' +
    '</body>';

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
    let expectedResult = {
      '<img src="../foo.jpg">': '../foo.jpg',
      '<link rel=stylesheet href="/styles/thing.css">': '/styles/thing.css',
      '<script src="scripts/x.js"></script>': 'scripts/x.js',
      '<script src="scripts/y.js"></script>': 'scripts/y.js',
    };

    let actualResult = UrlReplacer._parseHtml(htmlContent);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _parseCss() and returns valid object', function() {
    let expectedResult = {'url("test.png")': 'test.png'};

    let actualResult = UrlReplacer._parseCss(cssContent);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _replace() calls _parseHtml() and returns valid object', function() {
    let extension = 'html';
    let expectedResult = '<body><img src="../foo.jpg?test_version"><p>hi</p>' +
      '<script src="scripts/x.js?test_version"></script><script src="scripts/y.js?test_version"></script>' +
      '<link rel=stylesheet href="/styles/thing.css?test_version"></body>';

    let actualResult = urlReplacer._replace(htmlContent, extension);

    chai.expect(actualResult).to.eql(expectedResult);
  });

  test('Check _replace() calls _parseCss() and returns valid object', function() {

    let extension = 'css';
    let expectedResult = '.test { background-image: url("test.png?test_version"); }';

    let actualResult = urlReplacer._replace(cssContent, extension);

    chai.expect(actualResult).to.eql(expectedResult);
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
