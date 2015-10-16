/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedAttachingPolicyToBucketException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedAttachingPolicyToBucketException';

suite('Provisioning/Service/Exception/FailedAttachingPolicyToBucketException', function() {

  test('Class FailedAttachingPolicyToBucketException', function() {
    let e = new FailedAttachingPolicyToBucketException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedAttachingPolicyToBucketException);
  });
});
