'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai'
import {Prompt} from '../../../lib/Helpers/Terminal/Prompt';
import {ReadlineSync} from '../../../lib/Helpers/Terminal/ReadlineSync';
import {ReadlineSyncMock} from '../../mock/Helpers/ReadlineSyncMock';

chai.use(sinonChai);

suite('Helpers/Terminal/Prompt', function() {
  let text = 'test text';
  let prompt = new Prompt(text);

  test('Class Prompt exists in Helpers/Terminal/Prompt', function() {
    chai.expect(typeof Prompt).to.equal('function');
  });

  test('Check constructor sets  value for _text', function() {
    chai.expect(prompt.text).to.be.equal(text);
  });

  test('Check constructor sets valid default value for _syncMode=false', function() {
    chai.expect(prompt.syncMode).to.be.equal(false);
  });

  test('Check _createReadlineInterface() returns instance of ReadlineSync for sync', function() {
    let actualResult = Prompt._createReadlineInterface(true);

    chai.expect(actualResult).to.be.an.instanceof(ReadlineSync);
  });

  test('Check _choicesError() returns valid string', function() {
    let choices = ['first test string', 'second test string'];

    let actualResult = Prompt._choicesError(choices);

    chai.expect(actualResult).to.equal(`You have to choose one of the following values: ${choices.join(', ')}`);
  });

  test('Check _oct() converts octal number in decimal', function() {
    chai.expect(Prompt._oct(0)).to.equal(0);
    chai.expect(Prompt._oct(5)).to.equal(5);
    chai.expect(Prompt._oct('11')).to.equal(9);
    chai.expect(Prompt._oct('13')).to.equal(11);
    chai.expect(Prompt._oct('21')).to.equal(17);

    //negativi case
    chai.expect(Prompt._oct('8')).to.equal(0);
  });

  test('Check _trigger()', function() {
    let readlineSyncMock = new ReadlineSyncMock();
    let spyCallback = sinon.spy();

    readlineSyncMock.setMode(ReadlineSyncMock.DATA_MODE);

    let actualResult = prompt._trigger(readlineSyncMock, text, spyCallback);

    chai.expect(spyCallback).to.have.been.calledWith();

    let callbackArgs = spyCallback.args[0];

    chai.expect(actualResult).to.be.an.instanceof(Prompt);

    chai.expect(callbackArgs).to.eql([ReadlineSyncMock.DATA]);
  });
});