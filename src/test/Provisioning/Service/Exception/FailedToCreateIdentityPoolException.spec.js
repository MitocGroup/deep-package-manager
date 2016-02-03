/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateIdentityPoolException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateIdentityPoolException';

suite('Provisioning/Service/Exception/FailedToCreateIdentityPoolException', () => {

  test('Class FailedToCreateIdentityPoolException', () => {
    let e = new FailedToCreateIdentityPoolException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateIdentityPoolException);
  });
});
