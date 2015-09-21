'use strict';

import chai from 'chai';
import {Hash} from '../../lib.compiled/Helpers/Hash';
import Crc from 'crc';
import Crypto from 'crypto';

suite('Helpers/Hash', function() {
  let hash = new Hash();
  let inputDataObject = { keyToCrc: 'value'};
  let inputDataString = 'string_value';
  let actualResult = null;

  test('Class Hash exists in Helpers/Hash', function() {
    chai.expect(typeof Hash).to.equal('function');
  });

  test('Check crc32() static method returns crc32 value', function() {
    chai.expect(Hash.crc32(inputDataObject)).to.be.equal(Crc.crc32(inputDataObject).toString(16));
  });

  test('Check sha1() static method returns crc32 value', function() {
    actualResult = Crypto
      .createHash('sha1')
      .update(inputDataString)
      .digest('hex');
    chai.expect(Hash.sha1(inputDataString)).to.be.equal(actualResult);
  });

  test('Check md5() static method returns crc32 value', function() {
    actualResult = Crypto
      .createHash('md5')
      .update(inputDataString)
      .digest('hex');
    chai.expect(Hash.md5(inputDataString)).to.be.equal(actualResult);
  });

  test('Check pseudoRandomId() static method returns md5 random value', function() {
    chai.expect(Hash.pseudoRandomId(inputDataString)).to.be.not.equal(null);
  });
});
