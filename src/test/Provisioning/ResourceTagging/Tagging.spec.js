// THIS TEST WAS GENERATED AUTOMATICALLY ON Mon Feb 29 2016 14:26:50 GMT+0200 (EET)

'use strict';

import chai from 'chai';
import {Tagging} from '../../../lib/Provisioning/ResourceTagging/Tagging';
import {AbstractDriver} from '../../../lib/Provisioning/ResourceTagging/Driver/AbstractDriver';

class SampleTagging extends AbstractDriver {
  /**
   * @param {*} args
   */
  constructor(...args) {
    super(...args);

    this._testTagsPayload = null;
  }

  tag(cb) {
    this._testTagsPayload = this.tagsPayload;

    cb();
  }

  /**
   * @returns {null|{DeepApplicationId: String, DeepDeployId: String, DeepEnvironmentId: *, DeepEnvironmentName: String}[]|*}
   */
  get testTagsPayload() {
    return this._testTagsPayload;
  }
}

// @todo: Add more advanced tests
suite('Provisioning/ResourceTagging/Tagging', function() {
  test('Class Tagging exists in Provisioning/ResourceTagging/Tagging', () => {
    chai.expect(Tagging).to.be.an('function');
  });

  test('Check Resource Tagging payload', (done) => {
    let tagging = new Tagging(new SampleTagging({
      identifier: 'appId',
      deployId: 'deployId',
      env: 'dev',
      config: {
        awsAccountId: 1234567890,
      },
    }, 'appName'));

    tagging.tag(() => {
      chai.expect(tagging.drivers[0].testTagsPayload).to.be.deep.equal([
        { Key: 'DeepApplicationId', Value: 'appId' },
        { Key: 'DeepDeployId', Value: 'deployId' },
        { Key: 'DeepEnvironmentId', Value: 'ac7aa5bf' },
        { Key: 'DeepEnvironmentName', Value: 'dev' },
        { Key: 'DeepApplicationName', Value: 'appName' },
      ]);

      done();
    });
  });
});
