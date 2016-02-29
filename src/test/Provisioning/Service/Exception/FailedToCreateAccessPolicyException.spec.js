/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateAccessPolicyException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateAccessPolicyException';

suite('Provisioning/Service/Exception/FailedToCreateAccessPolicyException', () => {

  test('Class FailedToCreateAccessPolicyException', () => {
    let e = new FailedToCreateAccessPolicyException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateAccessPolicyException);
  });
});
