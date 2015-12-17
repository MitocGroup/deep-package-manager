'use strict';

import chai from 'chai';
import {DeployID} from '../../lib/Helpers/DeployID';

suite('Helpers/DeployID', function() {
  test('Class DeployID exists in Helpers/DeployID', function() {
    chai.expect(typeof DeployID).to.equal('function');
  });
});
