'use strict';

import chai from 'chai';
import {Instance} from '../../lib.compiled/Provisioning/Instance';
import {Instance as PropertyInstance} from '../../lib.compiled/Property/Instance';
import {InvalidArgumentException} from '../../lib.compiled/Exception/InvalidArgumentException';

suite('Provisioning/Instance', function() {
  let provisioningInstance = null;
  let error = null;

  test('Class Instance exists in Provisioning/Instance', function() {
    chai.expect(typeof Instance).to.equal('function');
  });

  test('Check constructor throws InvalidArgumentException exception when passed parameter is not instanceof PropertyInstance', function() {
    error = null;
    try {
      provisioningInstance = new Instance();
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceOf(InvalidArgumentException);

  });
});