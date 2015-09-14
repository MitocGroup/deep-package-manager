/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

//import {NodePackageManagerCompiler} from './Driver/NodePackageManagerCompiler';
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _MicroserviceMetadataAction = require('../Microservice/Metadata/Action');

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

/**
 * Compiles a microservice
 */

var Compiler = (function () {
  function Compiler() {
    _classCallCheck(this, Compiler);
  }

  _createClass(Compiler, null, [{
    key: 'compile',

    /**
     * Compile dependencies recursively
     *
     * @param {Microservice} microservice
     * @returns {Compiler}
     */
    value: function compile(microservice) {
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = Compiler.compilers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var compiler = _step.value;

          compiler.compile(microservice);
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

      return this;
    }

    /**
     * @param microservice
     * @returns {Object}
     */
  }, {
    key: 'buildLambdas',
    value: function buildLambdas(microservice) {
      var backendPath = microservice.autoload.backend;
      var lambdas = {};

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = microservice.resources.actions[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var action = _step2.value;

          if (action.type === _MicroserviceMetadataAction.Action.LAMBDA) {
            var source = _underscoreString2['default'].trim(action.source, '/');

            lambdas[action.identifier] = backendPath + '/' + source;
          }
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

      return lambdas;
    }

    /**
     * Retrieve available compilers
     * @todo: do we need NPM compiler anymore?
     *
     * @returns {Array}
     */
  }, {
    key: 'compilers',
    get: function get() {
      return [/*NodePackageManagerCompiler*/];
    }
  }]);

  return Compiler;
})();

exports.Compiler = Compiler;