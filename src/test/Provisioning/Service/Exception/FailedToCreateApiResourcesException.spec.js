/**
 * Created by Stefan Hariton on 10/5/15.
 */

'use strict';

import chai from 'chai';
import {FailedToCreateApiResourceException} from '../../../../lib/Provisioning/Service/Exception/FailedToCreateApiResourceException';

suite('Provisioning/Service/Exception/FailedToCreateApiResourceException', () => {

  test('Class FailedToCreateApiResourceException', () => {
    let e = new FailedToCreateApiResourceException([]);
    chai.expect(e).to.be.an.instanceof(FailedToCreateApiResourceException);
  });
});
