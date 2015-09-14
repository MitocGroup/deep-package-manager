/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _AbstractService2 = require('./AbstractService');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _mitocgroupDeepDb = require('@mitocgroup/deep-db');

var _mitocgroupDeepDb2 = _interopRequireDefault(_mitocgroupDeepDb);

/**
 * DynamoDB service
 */

var DynamoDBService = (function (_AbstractService) {
  _inherits(DynamoDBService, _AbstractService);

  /**
   * @param {Array} args
   */

  function DynamoDBService() {
    _classCallCheck(this, DynamoDBService);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    _get(Object.getPrototypeOf(DynamoDBService.prototype), 'constructor', this).apply(this, args);
  }

  /**
   * @returns {String}
   */

  _createClass(DynamoDBService, [{
    key: 'name',
    value: function name() {
      return _mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB;
    }

    /**
     * @returns {String[]}
     */
  }, {
    key: '_setup',

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {DynamoDBService}
     */
    value: function _setup(services) {
      this._createDbTables(this._rawModels)((function (tablesNames) {
        this._config = {
          tablesNames: tablesNames
        };

        this._ready = true;
      }).bind(this));

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {DynamoDBService}
     */
  }, {
    key: '_postProvision',
    value: function _postProvision(services) {
      this._readyTeardown = true;

      return this;
    }

    /**
     * @parameter {Core.Generic.ObjectStorage} services
     * @returns {DynamoDBService}
     */
  }, {
    key: '_postDeployProvision',
    value: function _postDeployProvision(services) {
      this._ready = true;

      return this;
    }

    /**
     * @param {Object} models
     * @returns {Function}
     * @private
     */
  }, {
    key: '_createDbTables',
    value: function _createDbTables(models) {
      var tablesNames = this.generateTableNames(models);

      var deepDb = new _mitocgroupDeepDb2['default'](models, tablesNames);

      return (function (callback) {
        deepDb.assureTables(function () {
          callback(tablesNames);
        });
      }).bind(this);
    }

    /**
     * @returns {Object}
     * @private
     */
  }, {
    key: 'generateTableNames',

    /**
     * @param {Object} models
     * @returns {Object}
     */
    value: function generateTableNames(models) {
      var tables = {};

      for (var modelKey in models) {
        if (!models.hasOwnProperty(modelKey)) {
          continue;
        }

        var backendModels = models[modelKey];

        for (var modelName in backendModels) {
          if (!backendModels.hasOwnProperty(modelName)) {
            continue;
          }

          tables[modelName] = this.generateAwsResourceName(modelName, _mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB);
        }
      }

      return tables;
    }
  }, {
    key: '_rawModels',
    get: function get() {
      return this.provisioning.property.config.models;
    }
  }], [{
    key: 'AVAILABLE_REGIONS',
    get: function get() {
      return [_mitocgroupDeepCore2['default'].AWS.Region.ANY];
    }
  }]);

  return DynamoDBService;
})(_AbstractService2.AbstractService);

exports.DynamoDBService = DynamoDBService;