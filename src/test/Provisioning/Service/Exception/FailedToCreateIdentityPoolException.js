/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateIdentityPoolException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateIdentityPoolException';

suite('Provisioning/Service/Exception/FailedToCreateIdentityPoolException', function() {

  test('Class FailedToCreateIdentityPoolException', function() {
    let e = new FailedToCreateIdentityPoolException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateIdentityPoolException);
  });
});
