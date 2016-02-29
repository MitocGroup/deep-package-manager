/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedLambdaUploadException} from '../../../lib/Property/Exception/FailedLambdaUploadException';

suite('Property/Exception/FailedLambdaUploadException', () => {

  test('Class FailedLambdaUploadException', () => {
    let e = new FailedLambdaUploadException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedLambdaUploadException);
  });
});
