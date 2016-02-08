// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Feb 08 2016 11:57:30 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import {Module} from '../../lib/Registry/Module';

// @todo: Add more advanced tests
suite('Registry/Module', function() {
  test('Class Module exists in Registry/Module', () => {
    chai.expect(Module).to.be.an('function');
  });
});
