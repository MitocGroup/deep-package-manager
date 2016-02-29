/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedSettingIdentityPoolRolesException} from '../../../../lib/Provisioning/Service/Exception/FailedSettingIdentityPoolRolesException';

suite('Provisioning/Service/Exception/FailedSettingIdentityPoolRolesException', () => {

  test('Class FailedSettingIdentityPoolRolesException', () => {
    let e = new FailedSettingIdentityPoolRolesException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedSettingIdentityPoolRolesException);
  });
});
