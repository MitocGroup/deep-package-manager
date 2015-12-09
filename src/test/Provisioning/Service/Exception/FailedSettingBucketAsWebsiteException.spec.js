/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedSettingBucketAsWebsiteException} from '../../../../lib/Provisioning/Service/Exception/FailedSettingBucketAsWebsiteException';

suite('Provisioning/Service/Exception/FailedSettingBucketAsWebsiteException', function() {

  test('Class FailedSettingBucketAsWebsiteException', function() {
    let e = new FailedSettingBucketAsWebsiteException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedSettingBucketAsWebsiteException);
  });
});
