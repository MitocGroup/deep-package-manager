/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateApiResourceException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateApiResourceException';

suite('Provisioning/Service/Exception/FailedToCreateApiResourceException', function() {

  test('Class FailedToCreateApiResourceException', function() {
    let e = new FailedToCreateApiResourceException([]);
    chai.expect(e).to.be.an.instanceof(FailedToCreateApiResourceException);
  });
});
