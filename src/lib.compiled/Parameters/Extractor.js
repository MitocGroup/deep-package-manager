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

var _Schema = require('./Schema');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _jsonfile = require('jsonfile');

var _jsonfile2 = _interopRequireDefault(_jsonfile);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _PathTransformer = require('./PathTransformer');

var _util = require('util');

var Extractor = (function () {
  /**
   * @param {Object} schema
   */

  function Extractor() {
    var schema = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

    _classCallCheck(this, Extractor);

    this._schema = schema;
  }

  /**
   * @returns {Object}
   */

  _createClass(Extractor, [{
    key: 'schema',

    /**
     * @param {Object} schema
     * @returns {Object}
     */
    value: function schema() {
      var _schema = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      _schema = _schema || this._schema;

      return new _Schema.Schema(_schema);
    }

    /**
     * @param {Object} obj
     * @param {Object} schema
     * @returns {Object}
     */
  }, {
    key: 'extract',
    value: function extract(obj) {
      var schema = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];

      return this.schema(schema).extract(obj);
    }

    /**
     * @param {String} workingDir
     * @returns {string}
     */
  }, {
    key: 'extractOptimal',

    /**
     * @param {String} workingDir
     * @param {String} subSection
     * @param {Object} schema
     * @returns {Object}
     */
    value: function extractOptimal() {
      var workingDir = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
      var subSection = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var schema = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      var file = Extractor.parametersFile(workingDir);

      if (_fs2['default'].existsSync(file)) {
        return this.extractFromFile(file, subSection, schema);
      }

      return this.extractInteractive(schema);
    }

    /**
     * @param {String} file
     * @param {String} subSection
     * @param {Object} schema
     * @returns {Object}
     */
  }, {
    key: 'extractFromFile',
    value: function extractFromFile() {
      var file = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];
      var subSection = arguments.length <= 1 || arguments[1] === undefined ? null : arguments[1];
      var schema = arguments.length <= 2 || arguments[2] === undefined ? null : arguments[2];

      file = file || Extractor.PARAMETERS_FILE;

      var content = _jsonfile2['default'].readFileSync(file);

      return this.extract(subSection ? content[subSection] : content, schema);
    }

    /**
     * @param {Object} schema
     * @returns {Object}
     */
  }, {
    key: 'extractInteractive',
    value: function extractInteractive() {
      var schema = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return this.schema(schema).extractInteractive();
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'rawSchema',
    get: function get() {
      return this._schema;
    }
  }], [{
    key: 'parametersFile',
    value: function parametersFile() {
      var workingDir = arguments.length <= 0 || arguments[0] === undefined ? null : arguments[0];

      return _path2['default'].join(workingDir || process.cwd(), Extractor.PARAMETERS_FILE);
    }

    /**
     * @param {String} workingDir
     * @param {Object} obj
     * @param {Boolean} plainifyNested
     * @returns {String}
     */
  }, {
    key: 'dumpParameters',
    value: function dumpParameters(workingDir, obj) {
      var plainifyNested = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

      var file = Extractor.parametersFile(workingDir);

      var dumpObj = (0, _util._extend)({}, obj);

      if (!plainifyNested) {
        dumpObj = new _PathTransformer.PathTransformer().plainify(dumpObj);
      } else {
        var transformer = new _PathTransformer.PathTransformer();

        for (var key in dumpObj) {
          if (!dumpObj.hasOwnProperty(key)) {
            continue;
          }

          dumpObj[key] = transformer.plainify(dumpObj[key]);
        }
      }

      _jsonfile2['default'].writeFileSync(file, dumpObj);

      return file;
    }
  }, {
    key: 'PARAMETERS_FILE',
    get: function get() {
      return '.parameters.json';
    }
  }]);

  return Extractor;
})();

exports.Extractor = Extractor;