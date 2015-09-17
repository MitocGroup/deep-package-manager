'use strict';

import chai from 'chai';
import {Uploader} from '../../lib.compiled/Dependencies/Uploader';

suite('Dependencies/Uploader', function() {
  test('Class Uploader exists in Dependencies/Uploader', function() {
    chai.expect(typeof Uploader).to.equal('function');
  });
});