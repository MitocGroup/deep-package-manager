'use strict';

import chai from 'chai';
import {S3Service} from '../../../lib/Provisioning/Service/S3Service';

suite('Provisioning/Service/S3Service', () => {
  let s3Service = new S3Service();

  test('Class S3Service exists in Provisioning/Service/S3Service', () => {
    chai.expect(S3Service).to.be.an('function');
  });

  test('Check constructor sets valid default values', () => {
    chai.expect(s3Service._readyTeardown).to.be.equal(false);
    chai.expect(s3Service._ready).to.be.equal(false);
  });

  test('Check TMP_BUCKET static getter returns \'temp\'', () => {
    chai.expect(S3Service.TMP_BUCKET).to.be.equal('temp');
  });

  test('Check PUBLIC_BUCKET static getter returns \'public\'', () => {
    chai.expect(S3Service.PUBLIC_BUCKET).to.be.equal('public');
  });

  test('Check SYSTEM_BUCKET static getter returns \'system\'', () => {
    chai.expect(S3Service.SYSTEM_BUCKET).to.be.equal('system');
  });

  test('Check SHARED_BUCKET static getter returns \'shared\'', () => {
    chai.expect(S3Service.SHARED_BUCKET).to.be.equal('shared');
  });

  test('Check FS_BUCKETS_SUFFIX static getter returns array of suffix', () => {
    chai.expect(S3Service.FS_BUCKETS_SUFFIX.length).to.be.equal(4);
    chai.expect(S3Service.FS_BUCKETS_SUFFIX).to.be.include(S3Service.TMP_BUCKET);
    chai.expect(S3Service.FS_BUCKETS_SUFFIX).to.be.include(S3Service.PUBLIC_BUCKET);
    chai.expect(S3Service.FS_BUCKETS_SUFFIX).to.be.include(S3Service.SYSTEM_BUCKET);
    chai.expect(S3Service.FS_BUCKETS_SUFFIX).to.be.include(S3Service.SHARED_BUCKET);
  });

  test('Check AVAILABLE_REGIONS static getter returns \'*\'', () => {
    chai.expect(S3Service.AVAILABLE_REGIONS.length).to.be.equal(1);
    chai.expect(S3Service.AVAILABLE_REGIONS).to.be.include('*');
  });

  test('Check name() method returns \'s3\'', () => {
    chai.expect(s3Service.name()).to.be.equal('s3');
  });

  test('Check TMP_DAYS_LIFECYCLE static getter returns \'1\'', () => {
    chai.expect(S3Service.TMP_DAYS_LIFECYCLE).to.be.equal(1);
  });

  test('Check getStaticWebsiteConfig static method returns valid object', () => {
    chai.expect(S3Service.getStaticWebsiteConfig('bucketName').Bucket).to.be.equal('bucketName');
    chai.expect(S3Service.getStaticWebsiteConfig('bucketName').WebsiteConfiguration.ErrorDocument.Key).to.be.equal('errors/4xx.html');
    chai.expect(S3Service.getStaticWebsiteConfig('bucketName').WebsiteConfiguration.IndexDocument.Suffix).to.be.equal('index.html');
  });

  test('Check isBucketTmp static method returns false', () => {
    chai.expect(S3Service.isBucketTmp('bucketName')).to.be.equal(false);
  });

  test('Check isBucketTmp static method returns true', () => {
    chai.expect(S3Service.isBucketTmp('deep.dev.temp.9a8b28c9')).to.be.equal(true);
  });

  test('Check isBucketPublic static method returns false', () => {
    chai.expect(S3Service.isBucketPublic('bucketName')).to.be.equal(false);
  });

  test('Check isBucketPublic static method returns true', () => {
    chai.expect(S3Service.isBucketPublic('deep.dev.public.9a8b28c9')).to.be.equal(true);
  });

  test('Check _postProvision() method returns this._readyTeardown=\'true\'', () => {
    chai.expect(s3Service._readyTeardown).to.be.equal(false);
    let actualResult = s3Service._postProvision('service');
    chai.expect(actualResult._readyTeardown).to.be.equal(true);
  });

  test('Check _postDeployProvision() method returns this._ready=\'true\'', () => {
    s3Service._ready = false;
    let actualResult = s3Service._postDeployProvision('service');
    chai.expect(actualResult._ready).to.be.equal(true);
  });
});
