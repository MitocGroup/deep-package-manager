/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {FailedToExecuteApiGatewayMethodException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToExecuteApiGatewayMethodException';

suite('Provisioning/Service/Exception/FailedToExecuteApiGatewayMethodException', function() {

  test('Class FailedToExecuteApiGatewayMethodException', function () {
    let e = new FailedToExecuteApiGatewayMethodException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToExecuteApiGatewayMethodException);
  });
});