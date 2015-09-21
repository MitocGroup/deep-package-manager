'use strict';

import chai from 'chai';
import {AbstractCompiler} from '../../../lib.compiled/Compilation/Driver/AbstractCompiler';

/**
 * Compiler implements abstract method from AbstractCompiler
 */
class Compiler extends AbstractCompiler {
  constructor() {
    super();
  }

  compile() {
    return this;
  }
}

suite('Compilation/Driver/AbstractCompiler', function() {
  let compiler = new Compiler();

  test('Class AbstractCompiler exists in Compilation/Driver/AbstractCompiler', function() {
    chai.expect(typeof AbstractCompiler).to.equal('function');
  });
});