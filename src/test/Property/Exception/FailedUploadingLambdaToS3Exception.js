/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedUploadingLambdaToS3Exception} from '../../../lib.compiled/Property/Exception/FailedUploadingLambdaToS3Exception';

suite('Property/Exception/FailedUploadingLambdaToS3Exception', function() {

  test('Class FailedUploadingLambdaToS3Exception', function() {
    let e = new FailedUploadingLambdaToS3Exception('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedUploadingLambdaToS3Exception);
  });
});
