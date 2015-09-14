/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Action = require('./Action');

var _Instance = require('../Instance');

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _joi = require('joi');

var _joi2 = _interopRequireDefault(_joi);

var _actionSchema = require('./action.schema');

var _actionSchema2 = _interopRequireDefault(_actionSchema);

var _ExceptionInvalidConfigException = require('../Exception/InvalidConfigException');

var _ExceptionInvalidArgumentException = require('../../Exception/InvalidArgumentException');

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

/**
 * Resource loader for microservice
 */

var ResourceCollection = (function () {
  /**
   * @param {Object} rawResources
   */

  function ResourceCollection(rawResources) {
    _classCallCheck(this, ResourceCollection);

    if (!(rawResources instanceof Object)) {
      throw new _ExceptionInvalidArgumentException.InvalidArgumentException(rawResources, 'Object');
    }

    this._actions = [];
    this._rawResources = rawResources;

    for (var resourceName in rawResources) {
      if (!rawResources.hasOwnProperty(resourceName)) {
        continue;
      }

      var resourceActions = rawResources[resourceName];

      for (var actionName in resourceActions) {
        if (!resourceActions.hasOwnProperty(actionName)) {
          continue;
        }

        var configObject = _joi2['default'].validate(resourceActions[actionName], _actionSchema2['default']);

        if (configObject.error) {
          var configError = configObject.error;

          throw new _ExceptionInvalidConfigException.InvalidConfigException('Invalid resource action config for ' + resourceName + ':' + actionName + ' provided: ' + configError);
        }

        this._actions.push(new _Action.Action(resourceName, actionName, configObject.value));
      }
    }
  }

  /**
   * @param {String} backendPath
   * @param {Boolean} strict
   */

  _createClass(ResourceCollection, [{
    key: 'extract',

    /**
     * @returns {Object}
     */
    value: function extract() {
      var resources = {};

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this._actions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var resourceAction = _step.value;

          if (!resources[resourceAction.resourceName]) {
            resources[resourceAction.resourceName] = {};
          }

          resources[resourceAction.resourceName][resourceAction.name] = resourceAction.extract();
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      return resources;
    }

    /**
     * @returns {Array}
     */
  }, {
    key: 'actions',
    get: function get() {
      return this._actions;
    }

    /**
     * @returns {Object}
     */
  }, {
    key: 'rawResources',
    get: function get() {
      return this._rawResources;
    }
  }], [{
    key: 'create',
    value: function create(backendPath) {
      var strict = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

      backendPath = _underscoreString2['default'].rtrim(backendPath, '/');

      var resourcesFile = backendPath + '/' + _Instance.Instance.RESOURCES_FILE;

      var rawResources = {};

      // @todo: do we have to enable strict mode?
      try {
        rawResources = _jsonfile2['default'].readFileSync(resourcesFile);
      } catch (e) {
        if (strict) {
          throw e;
        }
      }

      return new ResourceCollection(rawResources);
    }
  }]);

  return ResourceCollection;
})();

exports.ResourceCollection = ResourceCollection;