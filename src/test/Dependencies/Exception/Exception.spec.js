/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {Exception} from '../../../lib/Dependencies/Exception/Exception';

suite('Dependencies/Exception', () => {

  test('Class Exception', () => {
    let e = new Exception('Test exception');
    chai.expect(e).to.be.an.instanceof(Exception);
  });
});
