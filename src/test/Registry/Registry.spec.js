// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Feb 08 2016 11:57:30 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import path from 'path';
import {Registry} from '../../lib/Registry/Registry';
import {Instance as Property} from '../../lib/Property/Instance';
import fs from 'fs';
import fse from 'fs-extra';

// @todo: Add more advanced tests
suite('Registry/Registry', function() {
  test('Class Registry exists in Registry/Registry', () => {
    chai.expect(Registry).to.be.an('function');
  });

  let testMaterialsPath = path.join(__dirname, '..', 'testMaterials');
  let registryPath = path.join(testMaterialsPath, 'registry');
  let localRegistry = Registry.createLocalRegistry(registryPath);

  // cleanup local test registry
  fse.removeSync(registryPath);

  test('Check Property1(_v2|_dep|_dep2|_dep2_nested)/Microservice published in local registry', (done) => {
    localRegistry.publishModule(path.join(testMaterialsPath, 'Property1', 'Microservice'), (error) => {
      chai.expect(error).to.not.exist;
      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', 'db.json'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.0.1', 'deepkg.json'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.0.1', 'module.tar'))).to.be.ok;

      localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_v2', 'Microservice'), (error) => {
        chai.expect(error).to.not.exist;
        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', 'db.json'))).to.be.ok;
        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.2.0', 'deepkg.json'))).to.be.ok;
        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.2.0', 'module.tar'))).to.be.ok;

        localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep', 'Microservice'), (error) => {
          chai.expect(error).to.not.exist;
          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', 'db.json'))).to.be.ok;
          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', '@0.1.0', 'deepkg.json'))).to.be.ok;
          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', '@0.1.0', 'module.tar'))).to.be.ok;

          localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep2', 'Microservice'), (error) => {
            chai.expect(error).to.not.exist;
            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', 'db.json'))).to.be.ok;
            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', '@2.0.0', 'deepkg.json'))).to.be.ok;
            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', '@2.0.0', 'module.tar'))).to.be.ok;

            localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep2_nested', 'Microservice'), (error) => {
              chai.expect(error).to.not.exist;
              chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', 'db.json'))).to.be.ok;
              chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', '@3.0.0', 'deepkg.json'))).to.be.ok;
              chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', '@3.0.0', 'module.tar'))).to.be.ok;

              done();
            });
          });
        });
      });
    });
  });

  test('Check Property1_v2 is fetching deps from local registry', (done) => {
    let propertyPath = path.join(testMaterialsPath, 'Property1_v2');
    let propertyRealPath = path.join(registryPath, '_test_property_');

    fse.copySync(propertyPath, propertyRealPath);
    fse.copySync(path.join(propertyRealPath, 'deeploy.test.json'), path.join(propertyRealPath, 'deeploy.json'));

    let property = new Property(propertyRealPath);

    localRegistry.install(property, (error) => {
      chai.expect(error).to.not.exist;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice', 'deepkg.json'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep', 'deepkg.json'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2', 'deepkg.json'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested'))).to.be.ok;
      chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested', 'deepkg.json'))).to.be.ok;

      done();
    });
  });
});
