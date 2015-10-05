/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {DuplicateRootException} from '../../../lib.compiled/Property/Exception/DuplicateRootException';

suite('Property/Exception/DuplicateRootException', function() {

  test('Class DuplicateRootException', function () {
    let rootMicroservice = {
      config: {
        identifier: "Root"
      }
    };

    let microservice = {
      config: {
        identifier: "Another microservice"
      }
    };

    let e = new DuplicateRootException(rootMicroservice, microservice);
    chai.expect(e).to.be.an.instanceof(DuplicateRootException);
  });
});