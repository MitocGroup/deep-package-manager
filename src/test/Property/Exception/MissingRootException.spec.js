/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {MissingRootException} from '../../../lib/Property/Exception/MissingRootException';

suite('Property/Exception/MissingRootException', () => {

  test('Class MissingRootException', () => {
    let e = new MissingRootException('Test exception');
    chai.expect(e).to.be.an.instanceof(MissingRootException);
  });
});
