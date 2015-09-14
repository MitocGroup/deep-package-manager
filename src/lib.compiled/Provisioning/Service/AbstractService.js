/**
 * Created by AlexanderC on 5/27/15.
 */

"use strict";

Object.defineProperty(exports, '__esModule', {
    value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _mitocgroupDeepCore = require('@mitocgroup/deep-core');

var _mitocgroupDeepCore2 = _interopRequireDefault(_mitocgroupDeepCore);

var _HelpersWaitFor = require('../../Helpers/WaitFor');

var _HelpersHash = require('../../Helpers/Hash');

var _ExceptionException = require('../../Exception/Exception');

/**
 * Abstract service
 */

var AbstractService = (function (_Core$OOP$Interface) {
    _inherits(AbstractService, _Core$OOP$Interface);

    /**
     * @param {Instance} provisioning
     */

    function AbstractService(provisioning) {
        _classCallCheck(this, AbstractService);

        _get(Object.getPrototypeOf(AbstractService.prototype), 'constructor', this).call(this, ['name', '_setup', '_postProvision', '_postDeployProvision']);

        this._config = {};
        this._provisioning = provisioning;
        this._ready = false;
        this._readyTeardown = false;
    }

    /**
     * @returns {string}
     */

    _createClass(AbstractService, [{
        key: 'setup',

        /**
         * @param {Core.Generic.ObjectStorage} services
         */
        value: function setup(services) {
            var wait = new _HelpersWaitFor.WaitFor();

            this._setup(services);

            wait.push((function () {
                if (this._ready) {
                    this._ready = false;
                    return true;
                }

                return false;
            }).bind(this));

            return wait;
        }

        /**
         * @param {Core.Generic.ObjectStorage} services
         */
    }, {
        key: 'postProvision',
        value: function postProvision(services) {
            var wait = new _HelpersWaitFor.WaitFor();

            this._postProvision(services);

            wait.push((function () {
                if (this._readyTeardown) {
                    this._readyTeardown = false;
                    return true;
                }

                return false;
            }).bind(this));

            return wait;
        }

        /**
         * @param {Core.Generic.ObjectStorage} services
         */
    }, {
        key: 'postDeployProvision',
        value: function postDeployProvision(services) {
            var wait = new _HelpersWaitFor.WaitFor();

            this._postDeployProvision(services);

            wait.push((function () {
                if (this._ready) {
                    this._ready = false;
                    return true;
                }

                return false;
            }).bind(this));

            return wait;
        }

        /**
         * @returns {Boolean}
         */
    }, {
        key: 'config',

        /**
         * @returns {Object}
         */
        value: function config() {
            return this._config;
        }

        /**
         * @returns {Property}
         */
    }, {
        key: 'getUniqueHash',

        /**
         * @param {String} microserviceIdentifier
         * @returns {String}
         */
        value: function getUniqueHash() {
            var microserviceIdentifier = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];

            return _HelpersHash.Hash.crc32(this.awsAccountId + microserviceIdentifier + this.propertyIdentifier);
        }

        /**
         * @param {String} resourceName
         * @param {String} awsService
         * @param {String} msIdentifier
         * @param {String} delimiter
         * @returns {String}
         */
    }, {
        key: 'generateAwsResourceName',
        value: function generateAwsResourceName(resourceName, awsService) {
            var msIdentifier = arguments.length <= 2 || arguments[2] === undefined ? '' : arguments[2];
            var delimiter = arguments.length <= 3 || arguments[3] === undefined ? AbstractService.DELIMITER_UPPER_CASE : arguments[3];

            var name = null;
            var uniqueHash = this.getUniqueHash(msIdentifier);
            var nameTplLength = (AbstractService.AWS_RESOURCES_PREFIX + this.env + uniqueHash).length;

            switch (delimiter) {
                case AbstractService.DELIMITER_UPPER_CASE:
                    resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

                    name = AbstractService.capitalizeFirst(AbstractService.AWS_RESOURCES_PREFIX) + AbstractService.capitalizeFirst(this.env) + AbstractService.capitalizeFirst(resourceName) + uniqueHash;

                    break;
                case AbstractService.DELIMITER_DOT:
                    nameTplLength += 3; // adding 3 dot delimiters
                    resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

                    name = AbstractService.AWS_RESOURCES_PREFIX + '.' + this.env + '.' + resourceName + '.' + uniqueHash;

                    break;
                case AbstractService.DELIMITER_UNDERSCORE:
                    nameTplLength += 3; // adding 3 underscore delimiters
                    resourceName = this.sliceNameToAwsLimits(resourceName, awsService, nameTplLength);

                    name = AbstractService.AWS_RESOURCES_PREFIX + '_' + this.env + '_' + resourceName + '_' + uniqueHash;

                    break;
                default:
                    throw new _ExceptionException.Exception('Undefined aws resource name delimiter ' + delimiter + '.');
            }

            return name;
        }

        /**
         * @param {String} resourceName
         * @param {String} awsService
         * @param {Integer} nameTplLength
         */
    }, {
        key: 'sliceNameToAwsLimits',
        value: function sliceNameToAwsLimits(resourceName, awsService, nameTplLength) {
            var slicedName = resourceName;
            var totalLength = nameTplLength + resourceName.length;
            var awsServiceLimit = null;

            switch (awsService) {
                case _mitocgroupDeepCore2['default'].AWS.Service.SIMPLE_STORAGE_SERVICE:
                    awsServiceLimit = 63;
                    break;

                case _mitocgroupDeepCore2['default'].AWS.Service.LAMBDA:
                case _mitocgroupDeepCore2['default'].AWS.Service.IDENTITY_AND_ACCESS_MANAGEMENT:
                    awsServiceLimit = 64;
                    break;

                case _mitocgroupDeepCore2['default'].AWS.Service.COGNITO_IDENTITY:
                    awsServiceLimit = 128;
                    break;

                case _mitocgroupDeepCore2['default'].AWS.Service.DYNAMO_DB:
                    awsServiceLimit = 255;
                    break;

                default:
                    throw new _ExceptionException.Exception('Naming limits for aws service ' + awsService + ' are not defined.');
            }

            if (totalLength > awsServiceLimit) {
                slicedName = resourceName.slice(0, -(totalLength - awsServiceLimit));
            }

            return slicedName;
        }

        /**
         * @param {String} str
         * @returns {String}
         */
    }, {
        key: 'readyTeardown',
        get: function get() {
            return this._readyTeardown;
        }

        /**
         * @returns {Boolean}
         */
    }, {
        key: 'ready',
        get: function get() {
            return this._ready;
        }
    }, {
        key: 'property',
        get: function get() {
            return this.provisioning.property;
        }

        /**
         * @returns {Provisioning}
         */
    }, {
        key: 'provisioning',
        get: function get() {
            return this._provisioning;
        }

        /**
         * @returns {String}
         */
    }, {
        key: 'propertyIdentifier',
        get: function get() {
            return this.property.identifier;
        }

        /**
         * @returns {String}
         */
    }, {
        key: 'awsAccountId',
        get: function get() {
            return this.property.config.awsAccountId;
        }

        /**
         * @returns {String}
         */
    }, {
        key: 'env',
        get: function get() {
            return this.property.config.env;
        }
    }], [{
        key: 'capitalizeFirst',
        value: function capitalizeFirst(str) {
            return str.charAt(0).toUpperCase() + str.slice(1);
        }
    }, {
        key: 'DELIMITER_UPPER_CASE',
        get: function get() {
            return 'upperCase';
        }

        /**
         * @returns {string}
         */
    }, {
        key: 'DELIMITER_DOT',
        get: function get() {
            return '.';
        }

        /**
         * @returns {string}
         */
    }, {
        key: 'DELIMITER_UNDERSCORE',
        get: function get() {
            return '_';
        }

        /**
         * @returns {string}
         */
    }, {
        key: 'AWS_RESOURCES_PREFIX',
        get: function get() {
            return 'deep';
        }
    }]);

    return AbstractService;
})(_mitocgroupDeepCore2['default'].OOP.Interface);

exports.AbstractService = AbstractService;