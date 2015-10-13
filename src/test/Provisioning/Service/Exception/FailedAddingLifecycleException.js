/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedAddingLifecycleException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedAddingLifecycleException';

suite('Provisioning/Service/Exception/FailedAddingLifecycleException', function() {

  test('Class FailedAddingLifecycleException', function() {
    let e = new FailedAddingLifecycleException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedAddingLifecycleException);
  });
});
