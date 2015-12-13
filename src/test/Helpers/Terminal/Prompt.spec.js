'use strict';

import chai from 'chai';
import {Prompt} from '../../../lib.compiled/Helpers/Terminal/Prompt';

suite('Helpers/Terminal/Prompt', function() {
  test('Class Prompt exists in Helpers/Terminal/Prompt', function() {
    chai.expect(typeof Prompt).to.equal('function');
  });
});
