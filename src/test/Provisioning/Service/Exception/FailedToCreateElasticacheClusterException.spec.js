/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateElasticacheClusterException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateElasticacheClusterException';

suite('Provisioning/Service/Exception/FailedToCreateElasticacheClusterException', () => {

  test('Class FailedToCreateElasticacheClusterException', () => {
    let e = new FailedToCreateElasticacheClusterException('Test exception');
    chai.expect(e).to.be.an.instanceof(FailedToCreateElasticacheClusterException);
  });
});
