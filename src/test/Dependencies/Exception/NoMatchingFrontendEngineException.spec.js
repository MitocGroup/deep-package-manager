/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {NoMatchingFrontendEngineException} from '../../../lib/Dependencies/Exception/NoMatchingFrontendEngineException';

suite('Dependencies/NoMatchingFrontendEngineException', function() {

  test('Class NoMatchingFrontendEngineException', function() {
    let e = new NoMatchingFrontendEngineException(['engine1', 'engine2']);
    chai.expect(e).to.be.an.instanceof(NoMatchingFrontendEngineException);
  });
});
