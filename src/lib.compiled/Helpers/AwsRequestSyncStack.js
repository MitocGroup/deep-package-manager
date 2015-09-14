/**
 * Created by AlexanderC on 6/2/15.
 */

"use strict";

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ExceptionException = require('../Exception/Exception');

var _WaitFor = require('./WaitFor');

/**
 * Synchronous stack for aws requests
 */

var AwsRequestSyncStack = (function () {
    function AwsRequestSyncStack() {
        _classCallCheck(this, AwsRequestSyncStack);

        this._stack = [];
        this._levels = [];
        this._completed = 0;
    }

    /**
     * @returns {Number}
     */

    _createClass(AwsRequestSyncStack, [{
        key: 'addLevel',

        /**
         * @returns {AwsRequestSyncStack}
         */
        value: function addLevel() {
            var newLevel = new AwsRequestSyncStack();

            this._levels.push(newLevel);

            return newLevel;
        }

        /**
         * @param {Number} level
         * @param {Boolean} strict
         * @returns {AwsRequestSyncStack}
         */
    }, {
        key: 'level',
        value: function level(_level, strict) {
            // @todo: remove implementing late call...
            if (_level > 1) {
                throw new _ExceptionException.Exception("Avoid using level > 1 until late call is implemented!");
            }

            while (this.levelsDepth < _level) {
                if (strict) {
                    var depth = this.levelsDepth;

                    throw new _ExceptionException.Exception('Current levels depth is ' + depth);
                }

                this.addLevel();
            }

            return this._levels[--_level];
        }

        /**
         *
         * @returns {Number}
         */
    }, {
        key: 'push',

        /**
         * @param {Object} request
         * @param {Function} callback
         */
        value: function push(request, callback) {
            request.on('complete', (function (response) {
                if (callback) {
                    callback(response.error, response.data);
                } else if (response.error) {
                    throw new _ExceptionException.Exception('Error while executing AWS request: ' + response.error);
                }

                this._completed++;
            }).bind(this));

            this._stack.push(AwsRequestSyncStack.wrapRequest(request));
        }

        /**
         * @param {Boolean} topOnly
         * @returns {WaitFor}
         */
    }, {
        key: 'join',
        value: function join() {
            var topOnly = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = this._stack[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var request = _step.value;

                    request.send();
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

            var wait = new _WaitFor.WaitFor();

            wait.push((function () {
                if (this.remaining > 0) {
                    return false;
                }

                this._completed = 0;
                this._stack = [];

                if (!topOnly) {
                    var _iteratorNormalCompletion2 = true;
                    var _didIteratorError2 = false;
                    var _iteratorError2 = undefined;

                    try {
                        for (var _iterator2 = this._levels[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                            var childStack = _step2.value;

                            wait.addChild(childStack.join());
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

                return true;
            }).bind(this));

            return wait;
        }

        /**
         * @param {Object} request
         * @return {Object}
         */
    }, {
        key: 'levelsDepth',
        get: function get() {
            return this._levels.length;
        }
    }, {
        key: 'count',
        get: function get() {
            return this._stack.length;
        }

        /**
         * @returns {Number}
         */
    }, {
        key: 'completed',
        get: function get() {
            return this._completed;
        }

        /**
         * @returns {Number}
         */
    }, {
        key: 'remaining',
        get: function get() {
            return this._stack.length - this._completed;
        }
    }], [{
        key: 'wrapRequest',
        value: function wrapRequest(request) {
            return new function () {
                var _response;

                return {
                    native: function native() {
                        return request;
                    },
                    response: function response() {
                        return _response;
                    },
                    sent: function sent() {
                        return !!_response;
                    },
                    send: function send() {
                        return _response || (_response = request.send());
                    }
                };
            }();
        }
    }]);

    return AwsRequestSyncStack;
})();

exports.AwsRequestSyncStack = AwsRequestSyncStack;