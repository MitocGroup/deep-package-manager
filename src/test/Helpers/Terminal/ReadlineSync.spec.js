'use strict';

import chai from 'chai';
import {ReadlineSync} from '../../../lib.compiled/Helpers/Terminal/ReadlineSync';

suite('Helpers/Terminal/ReadlineSync', function() {
  test('Class ReadlineSync exists in Helpers/Terminal/ReadlineSync', function() {
    chai.expect(typeof ReadlineSync).to.equal('function');
  });
});
