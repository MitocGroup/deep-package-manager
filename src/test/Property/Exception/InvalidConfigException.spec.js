/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {InvalidConfigException} from '../../../lib/Property/Exception/InvalidConfigException';

suite('Property/Exception/InvalidConfigException', function() {

  test('Class InvalidConfigException', function() {
    let e = new InvalidConfigException('Test exception');
    chai.expect(e).to.be.an.instanceof(InvalidConfigException);
  });
});