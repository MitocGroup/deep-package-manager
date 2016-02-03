/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {MissingRootIndexException} from '../../../lib/Property/Exception/MissingRootIndexException';

suite('Property/Exception/MissingRootIndexException', () => {

  test('Class MissingRootException', () => {
    let e = new MissingRootIndexException('Test exception');
    chai.expect(e).to.be.an.instanceof(MissingRootIndexException);
  });
});
