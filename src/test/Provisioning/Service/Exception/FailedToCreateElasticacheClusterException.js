/**
 * Created by Stefan Hariton on 10/5/15.
 */

"use strict";

import chai from 'chai'
import {FailedToCreateElasticacheClusterException} from '../../../../lib.compiled/Provisioning/Service/Exception/FailedToCreateElasticacheClusterException';

suite('Provisioning/Service/Exception/FailedToCreateElasticacheClusterException', function() {

    test('Class FailedToCreateElasticacheClusterException', function () {
        let e = new FailedToCreateElasticacheClusterException('Test exception');
        chai.expect(e).to.be.an.instanceof(FailedToCreateElasticacheClusterException);
    });
});