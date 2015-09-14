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

var _Dispatcher2 = require('./Dispatcher');

var _PropertyLambda = require('../Property/Lambda');

/**
 * Dependencies uploader
 */

var Uploader = (function (_Dispatcher) {
    _inherits(Uploader, _Dispatcher);

    /**
     * @param {AbstractDriver} driver
     */

    function Uploader(driver) {
        _classCallCheck(this, Uploader);

        _get(Object.getPrototypeOf(Uploader.prototype), 'constructor', this).call(this, driver);
    }

    /**
     * @param {Microservice} microservice
     * @param {Function} callback
     */

    _createClass(Uploader, [{
        key: 'dispatch',
        value: function dispatch(microservice, callback) {
            microservice.compile(true);
            var lambdas = microservice.config.lambdas;

            var wait = new _HelpersWaitFor.WaitFor();
            var remaining = 0;

            for (var lambdaIdentifier in lambdas) {
                if (!lambdas.hasOwnProperty(lambdaIdentifier)) {
                    continue;
                }

                var lambdaPath = lambdas[lambdaIdentifier];

                remaining++;

                _PropertyLambda.Lambda.createPackage(lambdaPath).ready((function () {
                    remaining--;
                }).bind(this));
            }

            wait.push((function () {
                return remaining <= 0;
            }).bind(this));

            wait.ready((function () {
                this._driver.push(microservice.basePath, microservice.identifier, microservice.version, callback);
            }).bind(this));
        }
    }]);

    return Uploader;
})(_Dispatcher2.Dispatcher);

exports.Uploader = Uploader;