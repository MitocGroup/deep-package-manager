/**
 * Created by AlexanderC on 7/28/15.
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

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _MicroserviceInstance = require('../Microservice/Instance');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _HelpersWaitFor = require('../Helpers/WaitFor');

/**
 * Dependencies dispatcher
 */

var Dispatcher = (function (_Core$OOP$Interface) {
  _inherits(Dispatcher, _Core$OOP$Interface);

  /**
   * @param {AbstractDriver} driver
   */

  function Dispatcher(driver) {
    _classCallCheck(this, Dispatcher);

    _get(Object.getPrototypeOf(Dispatcher.prototype), 'constructor', this).call(this, ['dispatch']);

    this._driver = driver;
    this._microservices = null;
  }

  /**
   * @param {Function} callback
   */

  _createClass(Dispatcher, [{
    key: 'dispatchBatch',
    value: function dispatchBatch(callback) {
      this._resolveStack = [];

      var wait = new _HelpersWaitFor.WaitFor();
      var stackSize = 0;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.microservices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var microservice = _step.value;

          this.dispatch(microservice, (function () {
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
        this._resolveStack = [];

        callback();
      }).bind(this));
    }

    /**
     * @returns {AbstractDriver}
     */
  }, {
    key: 'driver',
    get: function get() {
      return this._driver;
    }

    /**
     * @returns {Microservice[]}
     */
  }, {
    key: 'microservices',
    get: function get() {
      if (this._microservices === null) {
        this._microservices = [];

        var files = _fs2['default'].readdirSync(this._driver.basePath);

        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = files[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var file = _step2.value;

            var fullPath = _path2['default'].join(this._driver.basePath, file);

            if (_fs2['default'].statSync(fullPath).isDirectory() && _fs2['default'].existsSync(_path2['default'].join(fullPath, _MicroserviceInstance.Instance.CONFIG_FILE))) {
              this._microservices.push(_MicroserviceInstance.Instance.create(fullPath));
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
      }

      return this._microservices;
    }
  }]);

  return Dispatcher;
})(_mitocgroupDeepCore2['default'].OOP.Interface);

exports.Dispatcher = Dispatcher;