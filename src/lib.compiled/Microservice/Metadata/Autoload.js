/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

/**
 * Autoloading directories of a microservice
 */

var Autoload = (function () {
  /**
   * @param {Object} rawConfig
   * @param {String} basePath
   */

  function Autoload(rawConfig, basePath) {
    _classCallCheck(this, Autoload);

    var frontend = _underscoreString2['default'].trim(rawConfig.frontend, '/');
    var backend = _underscoreString2['default'].trim(rawConfig.backend, '/');
    var docs = _underscoreString2['default'].trim(rawConfig.docs, '/');
    var models = _underscoreString2['default'].trim(rawConfig.models, '/');

    this._frontend = basePath + '/' + frontend;
    this._backend = basePath + '/' + backend;
    this._docs = basePath + '/' + docs;
    this._models = basePath + '/' + models;
  }

  /**
   * Get UI directory
   *
   * @returns {String}
   */

  _createClass(Autoload, [{
    key: 'extract',

    /**
     * @returns {Object}
     */
    value: function extract() {
      return {
        frontend: this._frontend,
        backend: this._backend,
        docs: this._docs,
        models: this._models
      };
    }
  }, {
    key: 'frontend',
    get: function get() {
      return this._frontend;
    }

    /**
     * Get backend directory
     *
     * @returns {String}
     */
  }, {
    key: 'backend',
    get: function get() {
      return this._backend;
    }

    /**
     * Get docs directory
     *
     * @returns {String}
     */
  }, {
    key: 'docs',
    get: function get() {
      return this._docs;
    }

    /**
     * Get models directory
     *
     * @returns {String}
     */
  }, {
    key: 'models',
    get: function get() {
      return this._models;
    }
  }]);

  return Autoload;
})();

exports.Autoload = Autoload;