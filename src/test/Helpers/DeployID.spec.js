'use strict';

import chai from 'chai';
import {DeployID} from '../../lib/Helpers/DeployID';
import {Instance as PropertyInstance} from '../../lib/Property/Instance';

suite('Helpers/DeployID', () => {
  let propertyInstance = new PropertyInstance('./test/testMaterials/Property2', 'deeploy.test.json');
  let deployID = new DeployID(propertyInstance);

  test('Class DeployID exists in Helpers/DeployID', () => {
    chai.expect(DeployID).to.be.an('function');
  });

  test('Check constructor sets value for _property', () => {
    chai.expect(deployID.property).to.be.equal(propertyInstance);
  });

  test('Check _rawId() getter', () => {
    let time = new Date().getTime().toString();

    //rounded 5 last digits
    let roundedTime = time.substring(0, time.length - 5);

    let expectedResult = `generated#${roundedTime}`;

    chai.expect(deployID._rawId).to.contains(expectedResult);
  });

  test('Check toString() returns by default crc32 hashed _rawId', () => {
    let rawId = deployID._rawId;
    let actualResult = deployID.toString();

    //compare only length because timestamp can be different
    chai.expect(actualResult.length).to.be.equal(8);
  });

  test('Check toString() throws Error for invalid algo', () => {
    let error = null;

    try {
      deployID.toString('invalid');
    } catch (e) {
      error = e;
    }

    chai.expect(error).to.be.an.instanceof(Error);
    chai.expect(error.message).to.equal('Unknown deployId generation algorithm');
  });
});
