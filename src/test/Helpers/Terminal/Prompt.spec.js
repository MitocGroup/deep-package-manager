'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai'
import {Prompt} from '../../../lib/Helpers/Terminal/Prompt';
import {ReadlineSync} from '../../../lib/Helpers/Terminal/ReadlineSync';
import {ReadlineSyncMock} from '../../mock/Helpers/ReadlineSyncMock';
import {ReadlineMock} from '../../mock/Helpers/ReadlineMock';
import requireProxy from 'proxyquire';

chai.use(sinonChai);

suite('Helpers/Terminal/Prompt', () => {
  let text = 'test text';

  //mocking readline
  let readlineMock = new ReadlineMock();
  readlineMock.setMode(ReadlineMock.DATA);
  readlineMock.fixBabelTranspile();
  let promptExport = requireProxy('../../../lib/Helpers/Terminal/Prompt', {
    'readline': readlineMock,
  });

  let Prompt = promptExport.Prompt;

  let prompt = new Prompt(text);

  test('Class Prompt exists in Helpers/Terminal/Prompt', () => {
    chai.expect(Prompt).to.be.an('function');
  });

  test('Check _noInteractionMode() returns false', () => {
    chai.expect(Prompt._noInteractionMode).to.equal(true);
  });

  test('Check constructor sets  value for _text', () => {
    chai.expect(prompt.text).to.be.equal(text);
  });

  test('Check constructor sets valid default value for _syncMode=false', () => {
    chai.expect(prompt.syncMode).to.be.equal(false);
  });

  test('Check _createReadlineInterface() returns instance of ReadlineSync for sync', () => {
    let actualResult = Prompt._createReadlineInterface(true);

    chai.expect(actualResult).to.be.an.instanceof(ReadlineSync);
  });

  test('Check _choicesError() returns valid string', () => {
    let choices = ['first test string', 'second test string'];

    let actualResult = Prompt._choicesError(choices);

    chai.expect(actualResult).to.equal(`You have to choose one of the following values: ${choices.join(', ')}`);
  });

  test('Check _oct() converts octal number in decimal', () => {
    chai.expect(Prompt._oct(0)).to.equal(0);
    chai.expect(Prompt._oct(5)).to.equal(5);
    chai.expect(Prompt._oct('11')).to.equal(9);
    chai.expect(Prompt._oct('13')).to.equal(11);
    chai.expect(Prompt._oct('21')).to.equal(17);

    //negativi case
    chai.expect(Prompt._oct('8')).to.equal(0);
  });

  test('Check _trigger() calls readlineInterface and returns answer in cb', () => {
    let readlineSyncMock = new ReadlineSyncMock();
    let spyCallback = sinon.spy();

    readlineSyncMock.setMode(ReadlineSyncMock.DATA_MODE);

    let actualResult = prompt._trigger(readlineSyncMock, text, spyCallback);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql([ReadlineSyncMock.DATA]);
  });

  test('Check syncMode setter', () => {
    prompt.syncMode = false;
    chai.expect(prompt.syncMode).to.be.equal(false);

    prompt.syncMode = true;
    chai.expect(prompt.syncMode).to.be.equal(true);
  });

  test('Check _prompt() calls _trigger->readlineInterface and returns answer in cb', () => {
    let spyCallback = sinon.spy();
    let text = 'test _prompt()';

    prompt.syncMode = false;
    readlineMock.setMode(ReadlineMock.DATA_MODE);

    let actualResult = prompt._prompt(spyCallback, text);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql([`${text}:`]);
  });

  test('Check read() calls _prompt() and returns answer in cb', () => {
    let spyCallback = sinon.spy();
    let text = 'test read()';

    prompt._text = text;
    prompt.syncMode = false;
    readlineMock.setMode(ReadlineMock.DATA_MODE);

    let actualResult = prompt.read(spyCallback);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql(['']);
  });

  test('Check readWithDefaults() calls _prompt() and returns answer in cb', () => {
    let spyCallback = sinon.spy();
    let text = 'test readWithDefaults()';
    let defaultValue = 'def val test';

    prompt._text = text;
    prompt.syncMode = false;
    readlineMock.setMode(ReadlineMock.DATA_MODE);

    let actualResult = prompt.readWithDefaults(spyCallback, defaultValue);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql([`${defaultValue}`]);
  });

  test('Check _promptHidden() for !_syncMode', () => {
    let spyCallback = sinon.spy();
    let text = 'test _promptHidden()';

    prompt._text = text;
    prompt.syncMode = false;
    readlineMock.setMode(ReadlineMock.DATA_MODE);

    let actualResult = prompt._promptHidden(spyCallback, text);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql([`${text}:`]);
  });

  test('Check readHidden()', () => {
    let spyCallback = sinon.spy();
    let text = 'test _promptHidden()';

    prompt._text = text;
    prompt.syncMode = false;
    readlineMock.setMode(ReadlineMock.DATA_MODE);

    let actualResult = prompt.readHidden(spyCallback);
    let callbackArgs = spyCallback.args[0];

    chai.expect(spyCallback).to.have.been.calledWith();
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
    chai.expect(callbackArgs).to.eql([``]);
  });

  //@todo - add smart logic
  //test('Check readChoice() returns answer in cb', () => {
  //  let spyCallback = sinon.spy();
  //
  //  prompt.syncMode = false;
  //  readlineMock.setMode(ReadlineMock.DATA_MODE);
  //
  //  let actualResult = prompt.readChoice(spyCallback, ['Y', 'N']);
  //  let callbackArgs = spyCallback.args[0];
  //
  //  chai.expect(spyCallback).to.have.been.calledWith();
  //  chai.expect(actualResult).to.be.an.instanceof(Prompt);
  //  chai.expect(callbackArgs).to.eql([ReadlineMock.DATA]);
  //});

  test('Check _noInteractionMode() returns true', () => {
    process.env['DEEP_NO_INTERACTION'] = 1;
    chai.expect(Prompt._noInteractionMode).to.equal(true);

    //delete property
    delete process.env['DEEP_NO_INTERACTION'];
    chai.expect(Prompt._noInteractionMode).to.equal(false);
  });

  test('Check read() for _noInteractionMode returns "" in cb', () => {
    let spyCallback = sinon.spy();

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.read(spyCallback);

    chai.expect(spyCallback).to.have.been.calledWithExactly('');
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });

  test('Check readWithDefaults() for _noInteractionMode returns second argument in cb', () => {
    let spyCallback = sinon.spy();
    let defaultValue = 'default';

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.readWithDefaults(spyCallback, defaultValue);

    chai.expect(spyCallback).to.have.been.calledWithExactly(defaultValue);
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });

  test('Check readHidden() for _noInteractionMode returns "" in cb', () => {
    let spyCallback = sinon.spy();

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.readHidden(spyCallback);

    chai.expect(spyCallback).to.have.been.calledWithExactly('');
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });

  test('Check readConfirm() for _noInteractionMode returns true in cb', () => {
    let spyCallback = sinon.spy();

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.readConfirm(spyCallback);

    chai.expect(spyCallback).to.have.been.calledWithExactly(true);
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });

  test('Check readChoice() for _noInteractionMode returns "" in cb', () => {
    let spyCallback = sinon.spy();

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.readChoice(spyCallback, []);

    chai.expect(spyCallback).to.have.been.calledWithExactly('');
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });

  test('Check readChoice() for _noInteractionMode returns first choice in cb', () => {
    let spyCallback = sinon.spy();

    process.env['DEEP_NO_INTERACTION'] = 1;

    let actualResult = prompt.readChoice(spyCallback, ['1', '2', '3']);

    chai.expect(spyCallback).to.have.been.calledWithExactly('1');
    chai.expect(actualResult).to.be.an.instanceof(Prompt);
  });
});
