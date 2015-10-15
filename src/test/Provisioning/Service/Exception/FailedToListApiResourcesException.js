/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToListApiResourcesException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToListApiResourcesException';

suite('Provisioning/Service/Exception/FailedToListApiResourcesException', function() {

  test('Class FailedToListApiResourcesException', function() {
    let e = new FailedToListApiResourcesException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToListApiResourcesException);
  });
});