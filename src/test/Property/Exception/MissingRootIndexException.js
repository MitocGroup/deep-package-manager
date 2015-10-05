/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {MissingRootIndexException} from '../../../lib.compiled/Property/Exception/MissingRootIndexException';

suite('Property/Exception/MissingRootIndexException', function() {

  test('Class MissingRootException', function () {
    let e = new MissingRootIndexException('Test exception');
    chai.expect(e).to.be.an.instanceof(MissingRootIndexException);
  });
});