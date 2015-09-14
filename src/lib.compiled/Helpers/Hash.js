/**
 * Created by AlexanderC on 6/9/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

var _crc = require('crc');

var _crc2 = _interopRequireDefault(_crc);

/**
 * Hashing helper
 */

var Hash = (function () {
  function Hash() {
    _classCallCheck(this, Hash);
  }

  _createClass(Hash, null, [{
    key: 'crc32',

    /**
     * @param {*} data
     * @returns {String}
     */
    value: function crc32(data) {
      return _crc2['default'].crc32(data).toString(16);
    }

    /**
     * @param {*} data
     * @returns {String}
     */
  }, {
    key: 'sha1',
    value: function sha1(data) {
      return Hash.create(data, 'sha1');
    }

    /**
     * @param {*} data
     * @returns {String}
     */
  }, {
    key: 'md5',
    value: function md5(data) {
      return Hash.create(data, 'md5');
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'pseudoRandomId',
    value: function pseudoRandomId() {
      var obj = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return Hash.md5(obj.toString() + Math.random().toString());
    }

    /**
     * @param {*} data
     * @param {String} algo
     * @returns {String}
     */
  }, {
    key: 'create',
    value: function create(data, algo) {
      return _crypto2['default'].createHash(algo).update(data).digest('hex');
    }
  }]);

  return Hash;
})();

exports.Hash = Hash;