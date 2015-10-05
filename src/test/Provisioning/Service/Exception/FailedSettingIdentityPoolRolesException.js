/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedSettingIdentityPoolRolesException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedSettingIdentityPoolRolesException';

suite('Provisioning/Service/Exception/FailedSettingIdentityPoolRolesException', function() {

  test('Class FailedSettingIdentityPoolRolesException', function() {
    let e = new FailedSettingIdentityPoolRolesException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedSettingIdentityPoolRolesException);
  });
});
