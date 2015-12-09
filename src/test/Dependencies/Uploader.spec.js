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

suite('Dependencies/Uploader', function() {
  let driver = 'driverTest';
  let uploader = new DependencyUploader(driver);

  test('Class Uploader exists in Dependencies/Uploader', function() {
    chai.expect(typeof Uploader).to.equal('function');
  });

  test('Class uploader successfully created', function() {
    chai.expect(uploader).to.not.equal(null);
  });
});
