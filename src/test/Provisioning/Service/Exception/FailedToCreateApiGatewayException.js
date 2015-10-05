/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {FailedToCreateApiGatewayException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateApiGatewayException';

suite('Provisioning/Service/Exception/FailedToCreateApiGatewayException', function() {

  test('Class FailedToCreateApiGatewayException', function () {
    let e = new FailedToCreateApiGatewayException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateApiGatewayException);
  });
});