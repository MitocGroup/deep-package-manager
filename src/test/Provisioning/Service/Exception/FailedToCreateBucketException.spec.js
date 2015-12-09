/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateBucketException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateBucketException';

suite('Provisioning/Service/Exception/FailedToCreateBucketException', function() {

  test('Class FailedToCreateBucketException', function() {
    let e = new FailedToCreateBucketException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateBucketException);
  });
});
