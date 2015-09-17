'use strict';

import chai from 'chai';
import {FileWalker} from '../../lib.compiled/Helpers/FileWalker';

suite('Helpers/FileWalker', function() {
  let fileWalker = new FileWalker();

  test('Class FileWalker exists in Helpers/FileWalker', function() {
    chai.expect(typeof FileWalker).to.equal('function');
  });

  test('Check constructor sets valid default value for _type', function() {
    chai.expect(fileWalker.type).to.be.equal(FileWalker.SIMPLE);
  });

  test('Check constructor sets valid default value for _ignoreFile=null', function() {
    chai.expect(fileWalker.ignoreFile).to.be.equal(null);
  });

  test('Check RECURSIVE static getter returns \'recursive\'', function() {
    chai.expect(FileWalker.RECURSIVE).to.be.equal('recursive');
  });

  test('Check SIMPLE getter returns \'simple\'', function() {
    chai.expect(FileWalker.SIMPLE).to.be.equal('simple');
  });
});
