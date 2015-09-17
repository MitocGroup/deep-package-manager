'use strict';

import chai from 'chai';
import {FileWalker} from '../../lib.compiled/Helpers/FileWalker';

suite('Helpers/FileWalker', function() {
  test('Class FileWalker exists in Helpers/FileWalker', function() {
    chai.expect(typeof FileWalker).to.equal('function');
  });

  test('Check RECURSIVE static getter returns \'recursive\'', function() {
    chai.expect(FileWalker.RECURSIVE).to.be.equal('recursive');
  });

  test('Check SIMPLE getter returns \'simple\'', function() {
    chai.expect(FileWalker.SIMPLE).to.be.equal('simple');
  });
});