/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToExecuteApiGatewayMethodException} from '../../../../lib/Provisioning/Service/Exception/FailedToExecuteApiGatewayMethodException';

suite('Provisioning/Service/Exception/FailedToExecuteApiGatewayMethodException', () => {

  test('Class FailedToExecuteApiGatewayMethodException', () => {
    let exception = null;
    try {
      exception = new FailedToExecuteApiGatewayMethodException('Test exception');
    } catch (e) {
      exception = e;
    }

    chai.expect(exception).to.be.an.instanceof(FailedToExecuteApiGatewayMethodException);
  });
});
