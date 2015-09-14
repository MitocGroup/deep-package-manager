/**
 * Created by AlexanderC on 6/23/15.
 */

'use strict';

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x5, _x6, _x7) { var _again = true; _function: while (_again) { var object = _x5, property = _x6, receiver = _x7; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x5 = parent; _x6 = property; _x7 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _zlib = require('zlib');

var _zlib2 = _interopRequireDefault(_zlib);

var _tar = require('tar');

var _tar2 = _interopRequireDefault(_tar);

var _fstream = require('fstream');

var _fstream2 = _interopRequireDefault(_fstream);

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _HelpersHash = require('../../Helpers/Hash');

var _ExceptionException = require('../Exception/Exception');

/**
 * Abstract dependency driver
 */

var AbstractDriver = (function (_Core$OOP$Interface) {
    _inherits(AbstractDriver, _Core$OOP$Interface);

    function AbstractDriver() {
        _classCallCheck(this, AbstractDriver);

        _get(Object.getPrototypeOf(AbstractDriver.prototype), 'constructor', this).call(this, ['pull', 'push']);

        this._basePath = process.cwd();
        this._prefix = '';
        this._dryRun = false;
    }

    /**
     * @param {Boolean} state
     */

    _createClass(AbstractDriver, [{
        key: '_getArchivePath',

        /**
         *
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Boolean} prefixed
         * @returns {String}
         */
        value: function _getArchivePath(dependencyName, dependencyVersion) {
            var prefixed = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return _path2['default'].join(this._basePath, this[prefixed ? '_getPrefixedBasename' : '_getBasename'](dependencyName, dependencyVersion));
        }

        /**
         *
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Boolean} prefixed
         * @returns {String}
         */
    }, {
        key: '_getFolderPath',
        value: function _getFolderPath(dependencyName, dependencyVersion) {
            var prefixed = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return _path2['default'].join(this._basePath, this[prefixed ? '_getPrefixedBasename' : '_getBasename'](dependencyName, dependencyVersion, true));
        }

        /**
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Boolean} skipExtension
         * @returns {String}
         */
    }, {
        key: '_getPrefixedBasename',
        value: function _getPrefixedBasename(dependencyName, dependencyVersion) {
            var skipExtension = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            return _path2['default'].join(this._prefix, this._getBasename(dependencyName, dependencyVersion, skipExtension));
        }

        /**
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Boolean} skipExtension
         * @returns {String}
         */
    }, {
        key: '_getBasename',
        value: function _getBasename(dependencyName, dependencyVersion) {
            var skipExtension = arguments.length <= 2 || arguments[2] === undefined ? false : arguments[2];

            var basename = dependencyName + '-' + dependencyVersion;

            return skipExtension ? basename : '' + basename + AbstractDriver.ARCHIVE_EXTENSION;
        }

        /**
         * @param {String} inputPath
         * @param {String} archivePath
         * @param {Function} callback
         */
    }, {
        key: '_pack',
        value: function _pack(inputPath, archivePath, callback) {
            var packer = _tar2['default'].Pack();
            var zpacker = _zlib2['default'].createGzip();

            var reader = _fstream2['default'].Reader({
                path: inputPath,
                type: 'Directory'
            });

            var dumper = _fstream2['default'].Writer({
                path: archivePath,
                type: 'File'
            });

            reader.on('error', AbstractDriver.errorCallback('reading sources'));
            zpacker.on('error', AbstractDriver.errorCallback('packing using zlib'));
            packer.on('error', AbstractDriver.errorCallback('packing using tar'));
            dumper.on('error', AbstractDriver.errorCallback('dumping archive'));

            reader.pipe(packer).pipe(zpacker).pipe(dumper);

            dumper.on('end', (function () {
                callback(archivePath);
            }).bind(this));
        }

        /**
         * @param {String} archivePath
         * @param {Function} callback
         */
    }, {
        key: '_unpack',
        value: function _unpack(archivePath, callback) {
            var archiveDirectory = _path2['default'].dirname(archivePath);
            var outputPath = _path2['default'].join(archiveDirectory, _path2['default'].basename(archivePath, AbstractDriver.ARCHIVE_EXTENSION));

            var reader = _fs2['default'].createReadStream(archivePath);

            var unPacker = _tar2['default'].Extract({
                strip: true,
                path: outputPath,
                type: 'Directory'
            });
            var zunPacker = _zlib2['default'].createGunzip();

            reader.on('error', AbstractDriver.errorCallback('reading archive'));
            zunPacker.on('error', AbstractDriver.errorCallback('unpacking using zlib'));
            unPacker.on('error', AbstractDriver.errorCallback('unpacking using tar'));

            reader.pipe(zunPacker).pipe(unPacker);

            unPacker.on('end', (function () {
                callback(outputPath);
            }).bind(this));
        }

        /**
         * @param {String} descriptor
         * @returns {Function}
         */
    }, {
        key: 'dryRun',
        set: function set(state) {
            this._dryRun = state;
        },

        /**
         * @returns {Boolean}
         */
        get: function get() {
            return this._dryRun;
        }

        /**
         * @param {String} prefix
         */
    }, {
        key: 'prefix',
        set: function set(prefix) {
            this._prefix = prefix;
        },

        /**
         * @returns {String}
         */
        get: function get() {
            return this._prefix;
        }

        /**
         * @param {String} path
         */
    }, {
        key: 'basePath',
        set: function set(path) {
            this._basePath = path;
        },

        /**
         * @returns {String}
         */
        get: function get() {
            return this._basePath;
        }
    }], [{
        key: 'errorCallback',
        value: function errorCallback(descriptor) {
            return (function (error) {
                throw new _ExceptionException.Exception('Error while ' + descriptor + ': ' + error);
            }).bind(this);
        }

        /**
         * @param {String} identifier
         * @returns {String}
         */
    }, {
        key: 'getTmpDir',
        value: function getTmpDir(identifier) {
            return _path2['default'].join(_os2['default'].tmpdir(), _HelpersHash.Hash.md5(identifier) + '-' + new Date().getTime());
        }

        /**
         * @returns {String}
         */
    }, {
        key: 'ARCHIVE_EXTENSION',
        get: function get() {
            return '.tar.gz';
        }
    }]);

    return AbstractDriver;
})(_mitocgroupDeepCore2['default'].OOP.Interface);

exports.AbstractDriver = AbstractDriver;