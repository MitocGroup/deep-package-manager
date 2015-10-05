/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {InfiniteRecursionException} from '../../../lib.compiled/Dependencies/Exception/InfiniteRecursionException';

suite('Dependencies/InfiniteRecursionException', function() {

  test('Class InfiniteRecursionException', function () {
    let e = new InfiniteRecursionException('Test exception');
    chai.expect(e).to.be.an.instanceof(InfiniteRecursionException);
  });
});