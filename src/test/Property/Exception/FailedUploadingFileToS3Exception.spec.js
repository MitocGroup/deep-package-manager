/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedUploadingFileToS3Exception} from '../../../lib/Property/Exception/FailedUploadingFileToS3Exception';

suite('Property/Exception/FailedUploadingFileToS3Exception', function() {

  test('Class FailedUploadingFileToS3Exception', function() {
    let e = new FailedUploadingFileToS3Exception('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedUploadingFileToS3Exception);
  });
});
