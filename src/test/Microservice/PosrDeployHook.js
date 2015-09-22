'use strict';

import chai from 'chai';
import {PostDeployHook} from '../../lib.compiled/Microservice/PostDeployHook';

suite('Microservice/PostDeployHook', function() {

  test('Class PostDeployHook exists in Microservice/PostDeployHook', function() {
    chai.expect(typeof PostDeployHook).to.equal('function');
  });
});
