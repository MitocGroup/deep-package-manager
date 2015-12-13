'use strict';

import chai from 'chai';
import {Prompt} from '../../../lib/Helpers/Terminal/Prompt';

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
});
