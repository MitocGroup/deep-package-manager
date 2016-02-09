'use strict';

import chai from 'chai';
import {JoiHelper} from '../../lib/Helpers/JoiHelper';
import Joi from 'joi';

suite('Helpers/JoiHelper', () => {
  test('Class JoiHelper exists in Helpers/JoiHelper', () => {
    chai.expect(JoiHelper).to.be.an('function');
  });

  test('Check website() returns valid joi object', () => {
    let actualResult = JoiHelper.website();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
    chai.expect(actualResult._tests[0].name).to.eql('uri');
  });

  test('Check email() returns valid joi object', () => {
    let actualResult = JoiHelper.email();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
    chai.expect(actualResult._tests[0].name).to.eql('email');
  });

  test('Check alnum() returns valid joi object', () => {
    let actualResult = JoiHelper.alnum();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
    chai.expect(actualResult._tests[0].name).to.eql('alphanum');
  });

  test('Check bool() returns valid joi object', () => {
    let actualResult = JoiHelper.bool();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('boolean');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
  });

  test('Check string() returns valid joi object', () => {
    let actualResult = JoiHelper.string();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
  });

  test('Check semver() returns valid joi object', () => {
    let actualResult = JoiHelper.semver();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
    chai.expect(actualResult._tests[0].name).to.eql('regex');
  });

  test('Check maybeString() returns valid joi object', () => {
    let actualResult = JoiHelper.maybeString();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'optional'});
  });

  test('Check list() returns valid joi object', () => {
    let actualResult = JoiHelper.list();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('array');
    chai.expect(actualResult._flags).to.eql({sparse: false, presence: 'required'});
  });

  test('Check stringArray() returns valid joi object', () => {
    let actualResult = JoiHelper.stringArray();

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('array');
    chai.expect(actualResult._flags).to.eql({sparse: false});
    chai.expect(actualResult._inner.items[0].isJoi).to.equal(true);
    chai.expect(actualResult._inner.items[0]._type).to.equal('string');
    chai.expect(actualResult._inner.items[0]._flags).to.eql({});
  });

  test('Check listEnum() returns valid joi object', () => {
    let actualResult = JoiHelper.listEnum(['opt', 'req']);

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('array');
    chai.expect(actualResult._flags).to.eql({sparse: false, presence: 'required'});
    chai.expect(actualResult._valids._set).to.eql(['opt', 'req',]);
  });

  test('Check stringEnum() returns valid joi object', () => {
    let actualResult = JoiHelper.stringEnum(['opt', 'req']);

    chai.expect(actualResult.isJoi).to.equal(true);
    chai.expect(actualResult._type).to.equal('string');
    chai.expect(actualResult._flags).to.eql({presence: 'required'});
    chai.expect(actualResult._valids._set).to.eql(['opt', 'req',]);
  });
});
