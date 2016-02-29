/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedAttachingPolicyToRoleException} from '../../../../lib/Provisioning/Service/Exception/FailedAttachingPolicyToRoleException';

suite('Provisioning/Service/Exception/FailedAttachingPolicyToRoleException', () => {

  test('Class FailedAttachingPolicyToRoleException', () => {
    let e = new FailedAttachingPolicyToRoleException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedAttachingPolicyToRoleException);
  });
});
