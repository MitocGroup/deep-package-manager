'use strict';

import chai from 'chai';
import {PostDeployHook} from '../../lib/Microservice/PostDeployHook';

suite('Microservice/PostDeployHook', () => {
  let microservice = {
    basePath: 'basePathTest',
  };
  let postDeployHook = new PostDeployHook(microservice);

  test('Class PostDeployHook exists in Microservice/PostDeployHook', () => {
    chai.expect(PostDeployHook).to.be.an('function');
  });

  test('Check constructor sets valid  value for _microservice', () => {
    chai.expect(postDeployHook._microservice).to.be.eql(microservice);
  });

  test('Check getHook() method returns null', () => {
    chai.expect(postDeployHook.getHook()).to.be.equal(null);
  });

  test('Check _wrap() method returns valid object', () => {
    chai.expect(typeof postDeployHook._wrap()).to.be.equal('function');
  });

  test('Check _getHookFile() method returns valid value', () => {
    chai.expect(postDeployHook._getHookFile()).to.be.equal(`${microservice.basePath}/${PostDeployHook.HOOK_BASENAME}`);
  });

  test('Check HOOK_BASENAME static getter method returns \'hook.post-deploy.js\'', () => {
    chai.expect(PostDeployHook.HOOK_BASENAME).to.be.equal('hook.post-deploy.js');
  });
});
