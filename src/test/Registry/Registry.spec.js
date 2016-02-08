// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Feb 08 2016 11:57:30 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import path from 'path';
import {Registry} from '../../lib/Registry/Registry';

// @todo: Add more advanced tests
suite('Registry/Registry', function() {
  test('Class Registry exists in Registry/Registry', () => {
    chai.expect(Registry).to.be.an('function');
  });

  let testMaterialsPath = path.join(__dirname, '..', 'testMaterials');
  let localRegistry = Registry.createLocalRegistry(path.join(testMaterialsPath, 'registry'));

  test('Check Property2/Microservice published in local registry', (done) => {
    localRegistry.publishModule(path.join(testMaterialsPath, 'Property2', 'Microservice'), (error) => {
      chai.expect(error).to.be.an(null);

      done();
    });
  });
});
