/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _DriverAbstractDriver = require('./Driver/AbstractDriver');

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _Resolver = require('./Resolver');

var _Uploader = require('./Uploader');

var _HelpersWaitFor = require('../Helpers/WaitFor');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _MicroserviceInstance = require('../Microservice/Instance');

/**
 * Dependencies manager
 */

var Manager = (function () {
    /**
     * @param {AbstractDriver} driver
     */

    function Manager(driver) {
        _classCallCheck(this, Manager);

        if (!(driver instanceof _DriverAbstractDriver.AbstractDriver)) {
            throw new _mitocgroupDeepCore2['default'].Exception.InvalidArgumentException(driver, 'AbstractDriver');
        }

        this._driver = driver;

        this._uploader = new _Uploader.Uploader(this._driver);
        this._resolver = new _Resolver.Resolver(this._driver);
    }

    /**
     * @returns {Uploader}
     */

    _createClass(Manager, [{
        key: 'pushBatch',

        /**
         * @param {String[]} subPaths
         * @param {Function} callback
         */
        value: function pushBatch(subPaths, callback) {
            this._executeBatch(subPaths, this._uploader, callback);
        }

        /**
         * @param {String[]} subPaths
         * @param {Function} callback
         */
    }, {
        key: 'pullBatch',
        value: function pullBatch(subPaths, callback) {
            this._executeBatch(subPaths, this._resolver, callback);
        }

        /**
         * @param {String[]} subPaths
         * @param {Function} executor
         * @param {Function} callback
         * @private
         */
    }, {
        key: '_executeBatch',
        value: function _executeBatch(subPaths, executor, callback) {
            var wait = new _HelpersWaitFor.WaitFor();
            var stackSize = subPaths.length;

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = subPaths[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var subPath = _step.value;

                    executor.dispatch(this._createMicroservice(subPath), (function () {
                        stackSize--;
                    }).bind(this));
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

            wait.push((function () {
                return stackSize <= 0;
            }).bind(this));

            wait.ready((function () {
                callback();
            }).bind(this));
        }

        /**
         * @param {String} subPath
         * @param {Function} callback
         * @returns {Resolver}
         */
    }, {
        key: 'pushSingle',
        value: function pushSingle(subPath, callback) {
            return this._uploader.dispatch(this._createMicroservice(subPath), callback);
        }

        /**
         * @param {String} subPath
         * @param {Function} callback
         * @returns {Resolver}
         */
    }, {
        key: 'pullSingle',
        value: function pullSingle(subPath, callback) {
            return this._resolver.dispatch(this._createMicroservice(subPath), callback);
        }

        /**
         * @param {String} subPath
         * @returns {Microservice}
         * @private
         */
    }, {
        key: '_createMicroservice',
        value: function _createMicroservice(subPath) {
            return _MicroserviceInstance.Instance.create(_path2['default'].join(this._driver.basePath, subPath));
        }

        /**
         * @param {Function} callback
         * @returns {Resolver}
         */
    }, {
        key: 'push',
        value: function push(callback) {
            return this._uploader.dispatchBatch(callback);
        }

        /**
         * @param {Function} callback
         * @returns {Resolver}
         */
    }, {
        key: 'pull',
        value: function pull(callback) {
            return this._resolver.dispatchBatch(callback);
        }
    }, {
        key: 'uploader',
        get: function get() {
            return this._uploader;
        }

        /**
         * @returns {Resolver}
         */
    }, {
        key: 'resolver',
        get: function get() {
            return this._resolver;
        }

        /**
         * @returns {AbstractDriver}
         */
    }, {
        key: 'driver',
        get: function get() {
            return this._driver;
        }
    }]);

    return Manager;
})();

exports.Manager = Manager;