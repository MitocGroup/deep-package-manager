/**
 * Created by AlexanderC on 6/5/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _HelpersFileWalker = require('../Helpers/FileWalker');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

/**
 * DB model class
 */

var Model = (function () {
    /**
     * @param {String} name
     * @param {Object} definition
     */

    function Model(name, definition) {
        _classCallCheck(this, Model);

        this._name = name;
        this._definition = definition;
    }

    /**
     * @param directories
     * @returns {Model[]}
     */

    _createClass(Model, [{
        key: 'extract',

        /**
         * @returns {Object}
         */
        value: function extract() {
            var obj = {};

            obj[this._name] = this._definition;

            return obj;
        }
    }, {
        key: 'name',

        /**
         * @returns {String}
         */
        get: function get() {
            return this._name;
        }

        /**
         * @returns {Object}
         */
    }, {
        key: 'definition',
        get: function get() {
            return this._definition;
        }

        /**
         * @returns {String}
         */
    }], [{
        key: 'create',
        value: function create() {
            var ext = Model.EXTENSION;
            var walker = new _HelpersFileWalker.FileWalker(_HelpersFileWalker.FileWalker.RECURSIVE);
            var filter = _HelpersFileWalker.FileWalker.matchExtensionsFilter(_HelpersFileWalker.FileWalker.skipDotsFilter(), ext);

            var models = [];

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _len = arguments.length, directories = Array(_len), _key = 0; _key < _len; _key++) {
                    directories[_key] = arguments[_key];
                }

                for (var _iterator = directories[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var dir = _step.value;
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = walker.walk(dir, filter)[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var modelFile = _step2.value;

                            var _name = _path2['default'].basename(modelFile, '.' + ext);
                            var definition = _jsonfile2['default'].readFileSync(modelFile);

                            models.push(new Model(_name, definition));
                        }
                    } catch (err) {
                        _didIteratorError2 = true;
                        _iteratorError2 = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
                                _iterator2['return']();
                            }
                        } finally {
                            if (_didIteratorError2) {
                                throw _iteratorError2;
                            }
                        }
                    }
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

            return models;
        }
    }, {
        key: 'EXTENSION',
        get: function get() {
            return 'json';
        }
    }]);

    return Model;
})();

exports.Model = Model;