/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ExceptionExecException = require('../../Exception/ExecException');

var _AbstractCompiler2 = require('./AbstractCompiler');

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _MicroserviceMetadataAction = require('../../Microservice/Metadata/Action');

var _syncExec = require('sync-exec');

var _syncExec2 = _interopRequireDefault(_syncExec);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

/**
 * Compiler dependencies using NPM package manager
 */

var NodePackageManagerCompiler = (function (_AbstractCompiler) {
    _inherits(NodePackageManagerCompiler, _AbstractCompiler);

    function NodePackageManagerCompiler() {
        _classCallCheck(this, NodePackageManagerCompiler);

        _get(Object.getPrototypeOf(NodePackageManagerCompiler.prototype), 'constructor', this).apply(this, arguments);
    }

    _createClass(NodePackageManagerCompiler, null, [{
        key: 'compile',

        /**
         * Compile an microservice dependencies recursively
         *
         * @param {Instance} microservice
         */
        value: function compile(microservice) {
            console.log('- Compile ' + microservice.identifier + ' microservice: ' + new Date().toTimeString());
            NodePackageManagerCompiler._compileBackend(microservice.autoload.backend, microservice.resources.actions);
        }

        /**
         * Compiles backend
         *
         * @param {String} backendPath
         * @param {Action[]} actions
         */
    }, {
        key: '_compileBackend',
        value: function _compileBackend(backendPath, actions) {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = actions[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var action = _step.value;

                    if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
                        console.log('- Compile ' + action.source + ' lambda: ' + new Date().toTimeString());
                        var source = _underscoreString2['default'].trim(action.source, '/');
                        source = backendPath + '/' + source;

                        NodePackageManagerCompiler._triggerNpmInstall(source);
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
        }

        /**
         * @param {String} source
         */
    }, {
        key: '_triggerNpmInstall',
        value: function _triggerNpmInstall(source) {
            var npm = NodePackageManagerCompiler._locateNpm();

            if (!npm) {
                throw new _ExceptionExecException.ExecException(1, 'Unable to locate npm executable.');
            }

            (0, _syncExec2['default'])('rm -rf ./node_modules', { cwd: source });

            var npmPath = _path2['default'].dirname(npm);
            var nodePath = _path2['default'].dirname(process.execPath);

            var result = (0, _syncExec2['default'])('PATH="$PATH:' + npmPath + ':' + nodePath + '" ' + npm + ' install', { cwd: source, env: process.env });

            if (result.status !== 0) {
                throw new _ExceptionExecException.ExecException(result.status, result.stderr);
            }
        }

        /**
         * @returns {String}
         * @private
         */
    }, {
        key: '_locateNpm',
        value: function _locateNpm() {
            var result = (0, _syncExec2['default'])('which npm');

            if (result.status === 0) {
                return _underscoreString2['default'].trim(result.stdout);
            }

            var bindDir = _path2['default'].dirname(process.title);
            result = (0, _syncExec2['default'])('which ' + bindDir + '/npm');

            if (result.status === 0) {
                return _underscoreString2['default'].trim(result.stdout);
            }
        }
    }]);

    return NodePackageManagerCompiler;
})(_AbstractCompiler2.AbstractCompiler);

exports.NodePackageManagerCompiler = NodePackageManagerCompiler;