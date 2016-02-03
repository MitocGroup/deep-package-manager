/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedAddingLifecycleException} from '../../../../lib/Provisioning/Service/Exception/FailedAddingLifecycleException';

suite('Provisioning/Service/Exception/FailedAddingLifecycleException', () => {

  test('Class FailedAddingLifecycleException', () => {
    let e = new FailedAddingLifecycleException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedAddingLifecycleException);
  });
});
