/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {FailedToCreateApiResourcesException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateApiResourcesException';

suite('Provisioning/Service/Exception/FailedToCreateApiResourcesException', function() {

  test('Class FailedToCreateApiResourcesException', function () {
    let e = new FailedToCreateApiResourcesException([]);
    chai.expect(e).to.be.an.instanceof(FailedToCreateApiResourcesException);
  });
});