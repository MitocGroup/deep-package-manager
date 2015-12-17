'use strict';

import chai from 'chai';
import {Exec} from '../../lib/Helpers/Exec';

suite('Helpers/Exec', function() {
  test('Class Exec exists in Helpers/Exec', function() {
    chai.expect(typeof Exec).to.equal('function');
  });
});
