/**
 * Created by AlexanderC on 6/1/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _underscoreString = require('underscore.string');

var _underscoreString2 = _interopRequireDefault(_underscoreString);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _ignore = require('ignore');

var _ignore2 = _interopRequireDefault(_ignore);

/**
 * File walker
 */

var FileWalker = (function () {
  /**
   * @param {String} type
   * @param {String} ignoreFile
   */

  function FileWalker() {
    var type = arguments.length <= 0 || arguments[0] === undefined ? FileWalker.SIMPLE : arguments[0];
    var ignoreFile = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

    _classCallCheck(this, FileWalker);

    this._type = type;
    this._ignoreFile = ignoreFile;
  }

  /**
   * @param {String} ignoreFile
   */

  _createClass(FileWalker, [{
    key: 'mkdir',

    /**
     * @param {String} dir
     * @param {Number} mode
     * @returns {FileWalker}
     */
    value: function mkdir(dir) {
      var mode = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      if (this._type === FileWalker.RECURSIVE) {
        _mkdirp2['default'].sync(dir, mode ? { mode: mode } : undefined);
      } else {
        _fs2['default'].mkdirSync(dir, mode);
      }

      return this;
    }

    /**
     * @param {String} source
     * @param {String} destination
     * @param {Function} filter
     * @returns {FileWalker}
     */
  }, {
    key: 'copy',
    value: function copy(source, destination) {
      var filter = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      filter = filter || function () {
        return true;
      };
      source = _underscoreString2['default'].rtrim(source, '/');
      destination = _underscoreString2['default'].rtrim(destination, '/');
      var skipDotFilter = FileWalker.skipDotsFilter(filter);

      var sourceOffset = source.length + 1;

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = this.walk(source, skipDotFilter)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var file = _step.value;

          var relativePath = file.substring(sourceOffset);
          var fileCopy = destination + '/' + relativePath;

          var fileDir = _path2['default'].dirname(fileCopy);

          this.mkdir(fileDir);

          _fs2['default'].renameSync(file, fileCopy);
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
     * @param {String} dir
     * @param {Function} filter
     * @returns {Array}
     */
  }, {
    key: 'walk',
    value: function walk(dir) {
      var filter = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      filter = filter || function () {
        return true;
      };
      var results = [];

      var list = _fs2['default'].readdirSync(dir);

      list = list.map(function (file) {
        return dir + '/' + file;
      });
      list = this._ignoreFile ? this._buildIgnoreFilter(dir).filter(list) : list;

      var _iteratorNormalCompletion2 = true;
      var _didIteratorError2 = false;
      var _iteratorError2 = undefined;

      try {
        for (var _iterator2 = list[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
          var file = _step2.value;

          if (this._type === FileWalker.RECURSIVE) {
            var stat = _fs2['default'].statSync(file);

            if (stat && stat.isDirectory()) {
              results = results.concat(this.walk(file));
            } else if (filter(file)) {
              results.push(file);
            }
          } else if (filter(file)) {
            results.push(file);
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

      return results;
    }

    /**
     * @param {String} dir
     * @returns {Object}
     * @private
     */
  }, {
    key: '_buildIgnoreFilter',
    value: function _buildIgnoreFilter(dir) {
      var ignoreFile = _path2['default'].join(dir, this._ignoreFile);

      if (_fs2['default'].existsSync(ignoreFile)) {
        return (0, _ignore2['default'])({}).addIgnoreFile(ignoreFile);
      }

      return {
        filter: function filter(list) {
          return list;
        }
      };
    }

    /**
     * @param {Function} originalFilter
     * @param {String[]} extensions
     * @returns {Function}
     */
  }, {
    key: 'ignoreFile',
    set: function set(ignoreFile) {
      this._ignoreFile = ignoreFile;
    },

    /**
     * @returns {String}
     */
    get: function get() {
      return this._ignoreFile;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'type',
    get: function get() {
      return this._type;
    }
  }], [{
    key: 'matchExtensionsFilter',
    value: function matchExtensionsFilter(originalFilter) {
      for (var _len = arguments.length, extensions = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        extensions[_key - 1] = arguments[_key];
      }

      var extensionsPlain = extensions.join('|');
      var regex = new RegExp('.(' + extensionsPlain + ')$', 'i');

      return function (file) {
        return regex.test(file) && (!originalFilter || originalFilter(file));
      };
    }

    /**
     * @param {Function} originalFilter
     * @returns {Function}
     */
  }, {
    key: 'skipDotsFilter',
    value: function skipDotsFilter(originalFilter) {
      return function (file) {
        return 0 !== _path2['default'].basename(file).indexOf('.') && (!originalFilter || originalFilter(file));
      };
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'RECURSIVE',
    get: function get() {
      return 'recursive';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'SIMPLE',
    get: function get() {
      return 'simple';
    }
  }]);

  return FileWalker;
})();

exports.FileWalker = FileWalker;