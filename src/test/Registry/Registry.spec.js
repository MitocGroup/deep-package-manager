// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Feb 08 2016 11:57:30 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import path from 'path';
import {Registry} from '../../lib/Registry/Registry';
import {Server} from '../../lib/Registry/Local/Server';
import {Authorizer} from '../../lib/Registry/Storage/Driver/Helpers/Api/Auth/Authorizer';
import {Exec} from '../../lib/Helpers/Exec';
import {Instance as Property} from '../../lib/Property/Instance';
import fs from 'fs';
import fse from 'fs-extra';
import aws from 'aws-sdk';

// @todo: Add more advanced tests
suite('Registry/Registry', function() {
  test('Class Registry exists in Registry/Registry', () => {
    chai.expect(Registry).to.be.an('function');
  });

  let testMaterialsPath = path.join(__dirname, '..', 'testMaterials');
  let registryPath = path.join(testMaterialsPath, 'registry');
  let localRegistry = Registry.createLocalRegistry(registryPath);

  //// cleanup local test registry
  //fse.removeSync(registryPath);
  //
  //test('Check Property1(_v2|_dep|_dep2|_dep2_nested)/Microservice published in local registry', (done) => {
  //  localRegistry.publishModule(path.join(testMaterialsPath, 'Property1', 'Microservice'), (error) => {
  //    chai.expect(error).to.not.exist;
  //    chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', 'db.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.0.1', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.0.1', 'module.tar'))).to.be.ok;
  //
  //    localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_v2', 'Microservice'), (error) => {
  //      chai.expect(error).to.not.exist;
  //      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', 'db.json'))).to.be.ok;
  //      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.2.0', 'deepkg.json'))).to.be.ok;
  //      chai.expect(fs.existsSync(path.join(registryPath, 'microservice1', '@0.2.0', 'module.tar'))).to.be.ok;
  //
  //      localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep', 'Microservice'), (error) => {
  //        chai.expect(error).to.not.exist;
  //        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', 'db.json'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', '@0.1.0', 'deepkg.json'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep', '@0.1.0', 'module.tar'))).to.be.ok;
  //
  //        localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep2', 'Microservice'), (error) => {
  //          chai.expect(error).to.not.exist;
  //          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', 'db.json'))).to.be.ok;
  //          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', '@2.0.0', 'deepkg.json'))).to.be.ok;
  //          chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2', '@2.0.0', 'module.tar'))).to.be.ok;
  //
  //          localRegistry.publishModule(path.join(testMaterialsPath, 'Property1_dep2_nested', 'Microservice'), (error) => {
  //            chai.expect(error).to.not.exist;
  //            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', 'db.json'))).to.be.ok;
  //            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', '@3.0.0', 'deepkg.json'))).to.be.ok;
  //            chai.expect(fs.existsSync(path.join(registryPath, 'microservice1dep2nested', '@3.0.0', 'module.tar'))).to.be.ok;
  //
  //            done();
  //          });
  //        });
  //      });
  //    });
  //  });
  //});

  //test('Check Property1_v2 is fetching deps from local registry', (done) => {
  //  let propertyPath = path.join(testMaterialsPath, 'Property1_v2');
  //  let propertyRealPath = path.join(registryPath, '_test_property_local_');
  //
  //  fse.copySync(propertyPath, propertyRealPath);
  //  fse.copySync(path.join(propertyRealPath, 'deeploy.test.json'), path.join(propertyRealPath, 'deeploy.json'));
  //
  //  let property = new Property(propertyRealPath);
  //
  //  localRegistry.install(property, (error) => {
  //    chai.expect(error).to.not.exist;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested', 'deepkg.json'))).to.be.ok;
  //
  //    done();
  //  });
  //});

  test('Check Property1_v2 is fetching deps from remote api registry server', (done) => {
    var REMOTE_REGISTRY = 'http://d1dpcus9odpwj6.cloudfront.net';
    let authToken = `deep-auth-token-${(new Date()).getTime()}`;
    let authorizer = Authorizer.createHeaderToken(authToken);

    Registry.createApiRegistry(
      REMOTE_REGISTRY,
      (error, apiRegistry) => {
        chai.expect(error).to.not.exist;

        apiRegistry.storage.driver.authorizer = authorizer;

        let propertyPath = path.join(testMaterialsPath, 'Property1_v2');
        let propertyRealPath = path.join(registryPath, '_test_property_api_');

        if (fs.existsSync(propertyRealPath)) {
          fse.removeSync(propertyRealPath);
        }

        fse.copySync(propertyPath, propertyRealPath);
        fse.copySync(path.join(propertyRealPath, 'deeploy.test.json'), path.join(propertyRealPath, 'deeploy.json'));

        let property = new Property(propertyRealPath);

        apiRegistry.install(property, (error) => {
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
      }
    );
  });


  //test('Check Property1_v2 is fetching deps from local api registry server', (done) => {
  //  let authToken = `deep-auth-token-${(new Date()).getTime()}`;
  //  let authorizer = Authorizer.createHeaderToken(authToken);
  //
  //  let registryServer = Registry.startApiServerAndCreateRegistry(
  //    registryPath,
  //    Server.DEFAULT_REGISTRY_HOST,
  //    (error, apiRegistry) => {
  //      chai.expect(error).to.not.exist;
  //
  //      apiRegistry.storage.driver.authorizer = authorizer;
  //
  //      let propertyPath = path.join(testMaterialsPath, 'Property1_v2');
  //      let propertyRealPath = path.join(registryPath, '_test_property_api_');
  //
  //      if (fs.existsSync(propertyRealPath)) {
  //        fse.removeSync(propertyRealPath);
  //      }
  //
  //      fse.copySync(propertyPath, propertyRealPath);
  //      fse.copySync(path.join(propertyRealPath, 'deeploy.test.json'), path.join(propertyRealPath, 'deeploy.json'));
  //
  //      let property = new Property(propertyRealPath);
  //
  //      apiRegistry.install(property, (error) => {
  //        chai.expect(error).to.not.exist;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice', 'deepkg.json'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep', 'deepkg.json'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2', 'deepkg.json'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested'))).to.be.ok;
  //        chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested', 'deepkg.json'))).to.be.ok;
  //
  //        done();
  //      });
  //    }
  //  );
  //
  //  registryServer.authorizer = authorizer;
  //});

  //test('Test remote S3 registry', (done) => {
  //  let bucket = 'test-deep-registry';
  //  let prefix = '__deep_registry__';
  //  let s3 = new aws.S3({
  //    accessKeyId: '<access_key>',
  //    secretAccessKey: '<secret_access_key>',
  //    region: 'us-east-1',
  //  });
  //
  //  let s3Registry = Registry.createS3Registry(s3, bucket, prefix);
  //
  //  new Exec(
  //    'aws s3 sync',
  //    '--profile=default',
  //    '--region=us-east-1',
  //    '--delete',
  //    '--storage-class=REDUCED_REDUNDANCY',
  //    `'${registryPath}'`,
  //    `'s3://${bucket}/${prefix}'`
  //  ).runSync();
  //
  //  let propertyPath = path.join(testMaterialsPath, 'Property1_v2');
  //  let propertyRealPath = path.join(registryPath, '_test_property_s3_');
  //
  //  if (fs.existsSync(propertyRealPath)) {
  //    fse.removeSync(propertyRealPath);
  //  }
  //
  //  fse.copySync(propertyPath, propertyRealPath);
  //  fse.copySync(path.join(propertyRealPath, 'deeploy.test.json'), path.join(propertyRealPath, 'deeploy.json'));
  //
  //  let property = new Property(propertyRealPath);
  //
  //  s3Registry.install(property, (error) => {
  //    chai.expect(error).to.not.exist;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'Microservice', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2', 'deepkg.json'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested'))).to.be.ok;
  //    chai.expect(fs.existsSync(path.join(propertyRealPath, 'microservice1dep2nested', 'deepkg.json'))).to.be.ok;
  //
  //    done();
  //  });
  //});
});
