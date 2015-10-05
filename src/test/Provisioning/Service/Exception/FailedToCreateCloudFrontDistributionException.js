/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateCloudFrontDistributionException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateCloudFrontDistributionException';

suite('Provisioning/Service/Exception/FailedToCreateCloudFrontDistributionException', function() {

  test('Class FailedToCreateCloudFrontDistributionException', function() {
    let e = new FailedToCreateCloudFrontDistributionException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateCloudFrontDistributionException);
  });
});
