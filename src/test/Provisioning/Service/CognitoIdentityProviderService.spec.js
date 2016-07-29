// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Jul 25 2016 14:32:58 GMT+0300 (EEST)

'use strict';

import chai from 'chai';
import Core from 'deep-core';
import {CognitoIdentityProviderService} from '../../../lib/Provisioning/Service/CognitoIdentityProviderService';
import {ProvisioningInstanceMock} from '../../mock/Provisioning/ProvisioningInstanceMock';
import {PropertyInstanceMock} from '../../mock/Property/PropertyInstanceMock';

// @todo: Add more advanced tests
suite('Provisioning/Service/CognitoIdentityProviderService', function() {
  test('Class CognitoIdentityProviderService exists in Provisioning/Service/CognitoIdentityProviderService', () => {
    chai.expect(CognitoIdentityProviderService).to.be.an('function');
  });

  let propertyInstance = new PropertyInstanceMock('./test/testMaterials/Property2', 'deeploy.test.json');
  let provisioningInstance = new ProvisioningInstanceMock(propertyInstance);
  let cognitoIdpService = new CognitoIdentityProviderService(provisioningInstance);

  test('Check "generateAllowActionsStatement" returns in instanceof Core.AWS.IAM.Statement', () => {
    let statement = cognitoIdpService.generateAllowActionsStatement(['testAction']);

    cognitoIdpService.injectConfig({
      UserPool: {
        Id: 'us_east_1_fakeId',
      },
    });

    chai.expect(statement).to.be.an.instanceof(Core.AWS.IAM.Statement);
  });
});
