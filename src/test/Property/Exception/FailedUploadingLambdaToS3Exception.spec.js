/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedUploadingLambdaToS3Exception} from '../../../lib/Property/Exception/FailedUploadingLambdaToS3Exception';

suite('Property/Exception/FailedUploadingLambdaToS3Exception', () => {

  test('Class FailedUploadingLambdaToS3Exception', () => {
    let e = new FailedUploadingLambdaToS3Exception('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedUploadingLambdaToS3Exception);
  });
});
