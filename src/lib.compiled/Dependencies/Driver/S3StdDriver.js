/**
 * Created by AlexanderC on 6/23/15.
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

var _AbstractDriver2 = require('./AbstractDriver');

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _ExceptionException = require('../Exception/Exception');

/**
 * S3 standard driver implementation
 */

var S3StdDriver = (function (_AbstractDriver) {
    _inherits(S3StdDriver, _AbstractDriver);

    /**
     * @param {Object} AWS
     * @param {String} bucket
     */

    function S3StdDriver(AWS, bucket) {
        _classCallCheck(this, S3StdDriver);

        _get(Object.getPrototypeOf(S3StdDriver.prototype), 'constructor', this).call(this);

        this._s3 = new AWS.S3();
        this._bucket = bucket;
    }

    /**
     * @returns {String}
     */

    _createClass(S3StdDriver, [{
        key: 'push',

        /**
         * @param {String} mainPath
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Function} callback
         */
        value: function push(mainPath, dependencyName, dependencyVersion, callback) {
            var archivePath = this._getArchivePath(dependencyName, dependencyVersion);

            this._pack(mainPath, archivePath, (function (archivePath) {
                var parameters = {
                    Bucket: this._bucket,
                    Key: this._getPrefixedBasename(dependencyName, dependencyVersion),
                    Body: _fs2['default'].createReadStream(archivePath)
                };

                if (this._dryRun) {
                    _fs2['default'].unlink(archivePath, callback);
                    return;
                }

                this._s3.putObject(parameters).on('complete', (function (response) {
                    if (response.error) {
                        throw new _ExceptionException.Exception('Error while persisting s3://' + parameters.Bucket + '/' + parameters.Key + ': ' + response.error);
                    }

                    _fs2['default'].unlink(archivePath, callback);
                }).bind(this)).send();
            }).bind(this));
        }

        /**
         * @param {String} dependencyName
         * @param {String} dependencyVersion
         * @param {Function} callback
         */
    }, {
        key: 'pull',
        value: function pull(dependencyName, dependencyVersion, callback) {
            var archivePath = this._getArchivePath(dependencyName, dependencyVersion);

            var outputStream = _fs2['default'].createWriteStream(archivePath);

            var parameters = {
                Bucket: this._bucket,
                Key: this._getPrefixedBasename(dependencyName, dependencyVersion)
            };

            if (this._dryRun) {
                callback();
                return;
            }

            this._s3.getObject(parameters).on('httpData', (function (chunk) {
                outputStream.write(chunk);
            }).bind(this)).on('httpDone', (function () {
                outputStream.end();
            }).bind(this)).on('complete', (function (response) {
                if (response.error) {
                    throw new _ExceptionException.Exception('Error while retrieving s3://' + parameters.Bucket + '/' + parameters.Key + ': ' + response.error);
                }

                this._unpack(this._getArchivePath(dependencyName, dependencyVersion), (function (outputPath) {
                    _fs2['default'].unlink(archivePath, (function () {
                        callback(outputPath);
                    }).bind(this));
                }).bind(this));
            }).bind(this)).send();
        }
    }, {
        key: 'bucket',
        get: function get() {
            return this._bucket;
        }
    }]);

    return S3StdDriver;
})(_AbstractDriver2.AbstractDriver);

exports.S3StdDriver = S3StdDriver;