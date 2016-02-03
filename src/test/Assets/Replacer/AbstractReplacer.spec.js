'use strict';

import chai from 'chai';
import {AbstractReplacer} from '../../../lib/Assets/Replacer/AbstractReplacer';
import {AbstractReplacerMock} from '../../mock/Assets/Replacer/AbstractReplacerMock'

suite('Assets/Replacer/AbstractReplacer', () => {
  let version = 'test_version';
  let abstractReplacer = new AbstractReplacerMock(version);

  test('Class AbstractReplacer exists in Assets/Replacer/AbstractReplacer', () => {
    chai.expect(AbstractReplacer).to.be.an('function');
  });

  test('Check constructor sets version', () => {
    chai.expect(abstractReplacer.version).to.equal(version);
  });

  test('Check replace() method', () => {
    chai.expect(abstractReplacer.replace().isReplaced).to.equal(true);
  });
});
