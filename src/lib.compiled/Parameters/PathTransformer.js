/**
 * Created by AlexanderC on 9/7/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _objectMerge = require('object-merge');

var _objectMerge2 = _interopRequireDefault(_objectMerge);

var PathTransformer = (function () {
  /**
   * @param {String} delimiter
   */

  function PathTransformer() {
    var delimiter = arguments.length <= 0 || arguments[0] === undefined ? PathTransformer.DEFAULT_DELIMITER : arguments[0];

    _classCallCheck(this, PathTransformer);

    this._delimiter = delimiter;
  }

  /**
   * @param {Object} obj
   * @returns {Object}
   */

  _createClass(PathTransformer, [{
    key: 'plainify',
    value: function plainify(obj) {
      var rawObj = {};

      for (var key in obj) {
        if (!obj.hasOwnProperty(key)) {
          continue;
        }

        var value = obj[key];

        if (typeof value === 'object') {
          var valueObjVector = this._extractKeyVectorAndValue(value);

          for (var i in valueObjVector) {
            if (!valueObjVector.hasOwnProperty(i)) {
              continue;
            }

            var valueObj = valueObjVector[i];

            rawObj['' + key + this._delimiter + valueObj.key] = valueObj.value;
          }
        } else {
          rawObj[key] = value;
        }
      }

      return rawObj;
    }

    /**
     * @param {Object} obj
     * @param {String} baseKey
     * @returns {Object[]}
     * @private
     */
  }, {
    key: '_extractKeyVectorAndValue',
    value: function _extractKeyVectorAndValue(obj) {
      var baseKey = arguments.length <= 1 || arguments[1] === undefined ? '' : arguments[1];

      var resultVector = [];

      for (var i in obj) {
        if (!obj.hasOwnProperty(i)) {
          continue;
        }

        var value = obj[i];

        if (typeof value === 'object') {
          resultVector = resultVector.concat(this._extractKeyVectorAndValue(value, i));
        } else {
          var prefix = baseKey ? '' + baseKey + this._delimiter : '';

          resultVector.push({ key: '' + prefix + i, value: value });
        }
      }

      return resultVector;
    }

    /**
     * @param {Object} rawObj
     * @returns {Object}
     */
  }, {
    key: 'transform',
    value: function transform(rawObj) {
      var obj = {};

      for (var key in rawObj) {
        if (!rawObj.hasOwnProperty(key)) {
          continue;
        }

        var value = rawObj[key];

        if (typeof value === 'undefined' || value === null) {
          continue;
        }

        var keyVector = key.split(this._delimiter);

        if (keyVector.length === 1) {
          obj[key] = value;
          continue;
        }

        var rootKey = keyVector.shift();

        obj[rootKey] = (0, _objectMerge2['default'])(obj[rootKey] || {}, PathTransformer._embedObject(keyVector, value));
      }

      return obj;
    }

    /**
     * @param {String[]} keyVector
     * @param {*} value
     * @returns {Object}
     * @private
     */
  }], [{
    key: '_embedObject',
    value: function _embedObject(keyVector, value) {
      var obj = {};
      var rootKey = keyVector.shift();

      obj[rootKey] = keyVector.length <= 0 ? value : PathTransformer._embedObject(keyVector, value);

      return obj;
    }
  }, {
    key: 'DEFAULT_DELIMITER',
    get: function get() {
      return '|';
    }
  }]);

  return PathTransformer;
})();

exports.PathTransformer = PathTransformer;