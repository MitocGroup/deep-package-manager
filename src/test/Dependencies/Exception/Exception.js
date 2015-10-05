/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {Exception} from '../../../lib.compiled/Dependencies/Exception/Exception';

suite('Dependencies/Exception', function() {

  test('Class Exception', function () {
    let e = new Exception('Test exception');
    chai.expect(e).to.be.an.instanceof(Exception);
  });
});