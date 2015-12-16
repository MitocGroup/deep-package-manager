'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai'
import {ReadlineSyncMock} from '../../mock/Helpers/ReadlineSyncMock';
import requireProxy from 'proxyquire';

chai.use(sinonChai);

suite('Helpers/Terminal/ReadlineSync', function() {
  let options = {
    option: 'Test option',
  };

  //mocking readline-sync
  let readlineSyncMock = new ReadlineSyncMock();
  readlineSyncMock.setMode(ReadlineSyncMock.DATA_MODE);
  readlineSyncMock.fixBabelTranspile();
  let readlineSyncExport = requireProxy('../../../lib/Helpers/Terminal/ReadlineSync', {
    'readline-sync': readlineSyncMock,
  });

  let ReadlineSync = readlineSyncExport.ReadlineSync;
  let readlineSync = new ReadlineSync();

  test('Class ReadlineSync exists in Helpers/Terminal/ReadlineSync', function() {
    chai.expect(typeof ReadlineSync).to.equal('function');
  });

  test('Check constructor sets valid default value for _options={}', function() {
    chai.expect(readlineSync.options).to.be.eql({});
  });

  test('Check constructor sets valid value for _options', function() {
    readlineSync = new ReadlineSync(options);
    chai.expect(readlineSync.options).to.be.eql(options);
  });

  test('Check createInterface() without args returns valid instance of ReadlineSync', function() {
    let actualResult = ReadlineSync.createInterface();

    chai.expect(actualResult).to.be.an.instanceof(ReadlineSync);
    chai.expect(actualResult.options).to.eql({});
  });

  test('Check createInterface() returns valid instance of ReadlineSync', function() {
    let actualResult = ReadlineSync.createInterface(options);

    chai.expect(actualResult).to.be.an.instanceof(ReadlineSync);
    chai.expect(actualResult.options).to.eql(options);
  });

  test('Check question() return valid instance of ReadlineSync', function() {
    let spyCallback = sinon.spy();

    readlineSync.question('question test', spyCallback);
    chai.expect(spyCallback).to.have.been.calledWithExactly(ReadlineSyncMock.DATA);
  });

  test('Check questionHidden() return valid instance of ReadlineSync', function() {
    let spyCallback = sinon.spy();

    readlineSync.questionHidden('question hidden test', spyCallback);
    chai.expect(spyCallback).to.have.been.calledWithExactly(ReadlineSyncMock.DATA);
  });
});
