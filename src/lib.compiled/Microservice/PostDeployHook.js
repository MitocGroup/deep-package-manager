/**
 * Created by AlexanderC on 9/15/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var PostDeployHook = (function () {
  /**
   * @param {Instance} microservice
   */

  function PostDeployHook(microservice) {
    _classCallCheck(this, PostDeployHook);

    this._microservice = microservice;
  }

  /**
   * @returns {Function}
   */

  _createClass(PostDeployHook, [{
    key: 'getHook',
    value: function getHook() {
      var hookFile = this._getHookFile();

      if (!_fs2['default'].existsSync(hookFile)) {
        return null;
      }

      var hook = require(hookFile);

      if (typeof hook !== 'function') {
        return null;
      }

      return this._wrap(hook);
    }

    /**
     * @param {Function} hook
     * @returns {Function}
     * @private
     */
  }, {
    key: '_wrap',
    value: function _wrap(hook) {
      return (function (provisioning, isUpdate, cb) {
        hook.bind({
          microservice: this._microservice,
          provisioning: provisioning,
          isUpdate: isUpdate
        })(cb);
      }).bind(this);
    }

    /**
     * @returns {String}
     * @private
     */
  }, {
    key: '_getHookFile',
    value: function _getHookFile() {
      return this._microservice.basePath + '/' + PostDeployHook.HOOK_BASENAME;
    }

    /**
     * @returns {String}
     */
  }], [{
    key: 'HOOK_BASENAME',
    get: function get() {
      return 'hook.post-deploy.js';
    }
  }]);

  return PostDeployHook;
})();

exports.PostDeployHook = PostDeployHook;