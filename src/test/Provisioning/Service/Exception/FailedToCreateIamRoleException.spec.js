/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateIamRoleException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateIamRoleException';

suite('Provisioning/Service/Exception/FailedToCreateIamRoleException', () => {

  test('Class FailedToCreateIamRoleException', () => {
    let e = new FailedToCreateIamRoleException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateIamRoleException);
  });
});
