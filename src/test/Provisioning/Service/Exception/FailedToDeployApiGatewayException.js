/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {FailedToDeployApiGatewayException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToDeployApiGatewayException';

suite('Provisioning/Service/Exception/FailedToDeployApiGatewayException', function() {

  test('Class FailedToDeployApiGatewayException', function () {
    let e = new FailedToDeployApiGatewayException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToDeployApiGatewayException);
  });
});