'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {AbstractReplacer} from '../../../lib.compiled/Assets/Replacer/AbstractReplacer';
import {AbstractReplacerMock} from '../../mock/Assets/Replacer/AbstractReplacerMock'

chai.use(sinonChai);

suite('Assets/Replacer/AbstractReplacer', function () {
  let version = 'test_version';
  let abstractReplacer = new AbstractReplacerMock(version);

  test('Class AbstractReplacer exists in Assets/Replacer/AbstractReplacer', function () {
    chai.expect(typeof AbstractReplacer).to.equal('function');
  });

  test('Check constructor sets version', function () {
    chai.expect(abstractReplacer.version).to.equal(version);
  });

  test('Check replace() method', function () {
    chai.expect(abstractReplacer.replace().isReplaced).to.equal(true);
  });
});
