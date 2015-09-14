/**
 * Created by AlexanderC on 6/3/15.
 */

"use strict";

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _ExceptionInvalidArgumentException = require('../Exception/InvalidArgumentException');

/**
 * Wait for something
 */

var WaitFor = (function () {
    function WaitFor() {
        _classCallCheck(this, WaitFor);

        this._stack = [];
        this._toSkip = [];
        this._children = [];
    }

    /**
     * @returns {Number}
     */

    _createClass(WaitFor, [{
        key: 'addChild',

        /**
         * @param {WaitFor} child
         * @returns {WaitFor}
         */
        value: function addChild(child) {
            if (!(child instanceof WaitFor)) {
                throw new _ExceptionInvalidArgumentException.InvalidArgumentException(child, WaitFor);
            }

            this._children.push(child);

            return this;
        }

        /**
         * @param {Number} index
         * @returns {WaitFor}
         */
    }, {
        key: 'child',
        value: function child(index) {
            if (this.childrenCount < index) {
                throw new _ExceptionInvalidArgumentException.InvalidArgumentException(index, 'existing index');
            }

            return this._children[index];
        }

        /**
         * @returns {Number}
         */
    }, {
        key: 'push',

        /**
         * @param {Function} condition
         * @returns {WaitFor}
         */
        value: function push(condition) {
            if (!(condition instanceof Function)) {
                throw new _ExceptionInvalidArgumentException.InvalidArgumentException(condition, 'Function');
            }

            this._stack.push(condition);

            return this;
        }

        /**
         * @param {Function} callback
         */
    }, {
        key: 'ready',
        value: function ready(callback) {
            if (!(callback instanceof Function)) {
                throw new _ExceptionInvalidArgumentException.InvalidArgumentException(callback, 'Function');
            }

            var skipStack = [];

            for (var i = 0; i < this.count; i++) {
                var condition = this._stack[i];

                if (condition()) {
                    this._toSkip.push(condition);
                    skipStack.push(i);
                }
            }

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = skipStack[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var i = _step.value;

                    delete this._stack[i];
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

            if (this.remaining > 0) {
                setTimeout((function () {
                    this.ready(callback);
                }).bind(this), WaitFor.TICK_TTL);
            } else {
                this._readyChildren(callback, 0);
            }
        }

        /**
         * @param {Function} callback
         * @param {Number} level
         */
    }, {
        key: '_readyChildren',
        value: function _readyChildren(callback, level) {
            var remaining = this._children.length - level;

            if (remaining <= 0) {
                callback();
                return;
            }

            var subWait = new WaitFor();

            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = this._children[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var child = _step2.value;

                    child.ready((function () {
                        remaining--;
                    }).bind(this));

                    level++;
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

            subWait.push((function () {
                return remaining <= 0;
            }).bind(this));

            subWait.ready((function () {
                this._readyChildren(callback, level + 1);
            }).bind(this));
        }

        /**
         * @returns {Number}
         */
    }, {
        key: 'childrenCount',
        get: function get() {
            return this._children.length;
        }

        /**
         * @returns {Array}
         */
    }, {
        key: 'children',
        get: function get() {
            return this._children;
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
        key: 'remaining',
        get: function get() {
            return this._stack.length - this._toSkip.length;
        }
    }], [{
        key: 'TICK_TTL',
        get: function get() {
            return 100;
        }
    }]);

    return WaitFor;
})();

exports.WaitFor = WaitFor;