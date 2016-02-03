'use strict';

import chai from 'chai';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import {Optimizer} from '../../lib/Assets/Optimizer';

suite('Assets/Optimizer', () => {
  let path = './test/testMaterials/assets/rawFiles';
  let optimizer = new Optimizer(path);

  test('Class Optimizer exists in Assets/Optimizer', () => {
    chai.expect(Optimizer).to.be.an('function');
  });

  test('Check constructor sets _path', () => {
    chai.expect(optimizer.path).to.equal(path);
  });

  test('Check constructor sets _compressionLevel', () => {
    chai.expect(optimizer.compressionLevel).to.equal(Optimizer.COMPRESSION_LEVEL);
  });

  test('Check COMPRESSION_LEVEL static getter', () => {
    chai.expect(Optimizer.COMPRESSION_LEVEL).to.equal(9);
  });

  test('Check compressionLevel setter', () => {
    optimizer.compressionLevel = -2.1;
    chai.expect(optimizer.compressionLevel).to.equal(-2);

    optimizer.compressionLevel = -1;
    chai.expect(optimizer.compressionLevel).to.equal(-1);

    optimizer.compressionLevel = -0.01;
    chai.expect(optimizer.compressionLevel).to.equal(0);

    optimizer.compressionLevel = 0;
    chai.expect(optimizer.compressionLevel).to.equal(0);

    optimizer.compressionLevel = 0.01;
    chai.expect(optimizer.compressionLevel).to.equal(0);

    optimizer.compressionLevel = 1;
    chai.expect(optimizer.compressionLevel).to.equal(1);

    optimizer.compressionLevel = 127;
    chai.expect(optimizer.compressionLevel).to.equal(127);
  });
});
