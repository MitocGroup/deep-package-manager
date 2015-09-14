/**
 * Created by AlexanderC on 8/26/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _syncExec = require('sync-exec');

var _syncExec2 = _interopRequireDefault(_syncExec);

var SharedAwsConfig = (function () {
  function SharedAwsConfig() {
    _classCallCheck(this, SharedAwsConfig);

    this._providers = SharedAwsConfig.DEFAULT_PROVIDERS;
    this._credentials = null;
  }

  /**
   * @returns {Object[]}
   */

  _createClass(SharedAwsConfig, [{
    key: 'addProvider',

    /**
     * @param {Object} provider
     */
    value: function addProvider(provider) {
      this._providers = provider;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'guess',
    value: function guess() {
      if (this._credentials) {
        return this._credentials;
      }

      for (var i in this._providers) {
        if (!this._providers.hasOwnProperty(i)) {
          continue;
        }

        var provider = this._providers[i];

        try {
          provider.refresh();
        } catch (e) {
          // do nothing...
        }
      }

      return this._chooseCredentials(this._providers);
    }

    /**
     * @param {Object[]} providers
     * @returns {Object}
     * @private
     */
  }, {
    key: '_chooseCredentials',
    value: function _chooseCredentials(providers) {
      var maxWeight = 0;
      var credentials = {
        accessKeyId: null,
        secretAccessKey: null,
        region: null
      };

      for (var i in providers) {
        if (!providers.hasOwnProperty(i)) {
          continue;
        }

        var provider = providers[i];
        var weight = this._getWeight(provider);

        if (maxWeight < weight) {
          maxWeight = weight;

          credentials.accessKeyId = provider.accessKeyId;
          credentials.secretAccessKey = provider.secretAccessKey;
          credentials.region = provider.region || 'us-west-2';
        }
      }

      this._credentials = credentials;

      return credentials;
    }

    /**
     * @param {Object} provider
     * @returns {number}
     * @private
     */
  }, {
    key: '_getWeight',
    value: function _getWeight(provider) {
      return (provider.accessKeyId ? 2 : 0) + (provider.secretAccessKey ? 2 : 0) + (provider.region ? 1 : 0);
    }

    /**
     * @returns {Function}
     * @constructor
     */
  }, {
    key: 'providers',
    get: function get() {
      return this._providers;
    }
  }], [{
    key: 'AwsCliConfig',
    get: function get() {
      return function () {
        return {
          accessKeyId: null,
          secretAccessKey: null,
          region: null,
          refresh: function refresh() {
            this.accessKeyId = (0, _syncExec2['default'])('aws configure get aws_access_key_id 2>/dev/null').stdout.toString().trim();
            this.secretAccessKey = (0, _syncExec2['default'])('aws configure get aws_secret_access_key 2>/dev/null').stdout.toString().trim();
            this.region = (0, _syncExec2['default'])('aws configure get region 2>/dev/null').stdout.toString().trim();
          }
        };
      };
    }

    /**
     * @returns {Object[]}
     */
  }, {
    key: 'DEFAULT_PROVIDERS',
    get: function get() {
      return [new _awsSdk2['default'].EnvironmentCredentials(), new _awsSdk2['default'].SharedIniFileCredentials(), new _awsSdk2['default'].FileSystemCredentials('~/.aws/config'), new SharedAwsConfig.AwsCliConfig()];
    }
  }]);

  return SharedAwsConfig;
})();

exports.SharedAwsConfig = SharedAwsConfig;