/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _HelpersWaitFor = require('../Helpers/WaitFor');

var _MicroserviceInstance = require('../Microservice/Instance');

//import {InfiniteRecursionException} from './Exception/InfiniteRecursionException';

var _Dispatcher2 = require('./Dispatcher');

/**
 * Dependencies resolver
 */

var Resolver = (function (_Dispatcher) {
    _inherits(Resolver, _Dispatcher);

    /**
     * @param {AbstractDriver} driver
     */

    function Resolver(driver) {
        _classCallCheck(this, Resolver);

        _get(Object.getPrototypeOf(Resolver.prototype), 'constructor', this).call(this, driver);

        this._resolveStack = [];
    }

    /**
     * @param {Microservice} microservice
     * @param {Function} callback
     */

    _createClass(Resolver, [{
        key: 'dispatch',
        value: function dispatch(microservice, callback) {
            this._pull(microservice.config.dependencies, (function (pulledDependencies) {
                var wait = new _HelpersWaitFor.WaitFor();
                var stackSize = 0;

                pulledDependencies.forEach((function (dependencyPath) {
                    stackSize++;

                    this.dispatch(_MicroserviceInstance.Instance.create(dependencyPath), (function () {
                        stackSize--;
                    }).bind(this));
                }).bind(this));

                wait.push((function () {
                    return stackSize <= 0;
                }).bind(this));

                wait.ready((function () {
                    callback();
                }).bind(this));
            }).bind(this));
        }

        /**
         * @param {Object} dependencies
         * @param {Function} callback
         */
    }, {
        key: '_pull',
        value: function _pull(dependencies, callback) {
            var wait = new _HelpersWaitFor.WaitFor();
            var stackSize = 0;
            var pulledDependencies = [];

            for (var dependencyName in dependencies) {
                if (!dependencies.hasOwnProperty(dependencyName)) {
                    continue;
                }

                var dependencyVersion = dependencies[dependencyName];

                if (this._resolveStack.indexOf(dependencyName) !== -1) {
                    //throw new InfiniteRecursionException(dependencyName, dependencyVersion);
                    continue;
                }

                stackSize++;
                this._resolveStack.push(dependencyName);

                this._driver.pull(dependencyName, dependencyVersion, (function (outputPath) {
                    pulledDependencies.push(outputPath);

                    stackSize--;
                }).bind(this));
            }

            wait.push((function () {
                return stackSize <= 0;
            }).bind(this));

            wait.ready((function () {
                callback(pulledDependencies);
            }).bind(this));
        }
    }]);

    return Resolver;
})(_Dispatcher2.Dispatcher);

exports.Resolver = Resolver;