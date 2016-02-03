'use strict';

import chai from 'chai';
import {Uploader} from '../../lib/Dependencies/Uploader';

/**
 * Dependency dispatcher implements abstract method from Dispatcher
 */
class DependencyUploader extends Uploader {
  constructor(driver) {
    super(driver);
  }

  dispatch() {
    return this;
  }
}

suite('Dependencies/Uploader', () => {
  let driver = 'driverTest';
  let uploader = new DependencyUploader(driver);

  test('Class Uploader exists in Dependencies/Uploader', () => {
    chai.expect(typeof Uploader).to.equal('function');
  });

  test('Class uploader successfully created', () => {
    chai.expect(uploader).to.not.equal(null);
  });
});
