/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedAttachingPolicyToBucketException} from '../../../../lib/Provisioning/Service/Exception/FailedAttachingPolicyToBucketException';

suite('Provisioning/Service/Exception/FailedAttachingPolicyToBucketException', () => {

  test('Class FailedAttachingPolicyToBucketException', () => {
    let e = new FailedAttachingPolicyToBucketException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedAttachingPolicyToBucketException);
  });
});
