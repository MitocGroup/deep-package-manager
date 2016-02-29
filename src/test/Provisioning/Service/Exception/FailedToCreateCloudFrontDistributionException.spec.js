/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateCloudFrontDistributionException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateCloudFrontDistributionException';

suite('Provisioning/Service/Exception/FailedToCreateCloudFrontDistributionException', () => {

  test('Class FailedToCreateCloudFrontDistributionException', () => {
    let e = new FailedToCreateCloudFrontDistributionException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateCloudFrontDistributionException);
  });
});
