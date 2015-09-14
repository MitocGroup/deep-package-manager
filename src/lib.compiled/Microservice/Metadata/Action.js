/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

/**
 * Single action instance
 */
Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Action = (function () {
  /**
   * @param {String} resourceName
   * @param {String} actionName
   * @param {Object} config
   */

  function Action(resourceName, actionName, config) {
    _classCallCheck(this, Action);

    this._resourceName = resourceName;
    this._name = actionName;
    this._description = config.description;
    this._type = config.type;
    this._methods = config.methods.map(function (m) {
      return m.toUpperCase();
    });
    this._source = config.source;
  }

  /**
   * @returns {Array}
   */

  _createClass(Action, [{
    key: 'extract',

    /**
     * @returns {Object}
     */
    value: function extract() {
      return {
        identifier: this.identifier,
        resourceName: this.resourceName,
        name: this.name,
        description: this.description,
        type: this.type,
        source: this.source,
        methods: this.methods
      };
    }
  }, {
    key: 'resourceName',

    /**
     * @returns {String}
     */
    get: function get() {
      return this._resourceName;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'name',
    get: function get() {
      return this._name;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'identifier',
    get: function get() {
      return this.resourceName + '-' + this.name;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'description',
    get: function get() {
      return this._description;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'type',
    get: function get() {
      return this._type;
    }

    /**
     * @returns {Array}
     */
  }, {
    key: 'methods',
    get: function get() {
      return this._methods;
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'source',
    get: function get() {
      return this._source;
    }
  }], [{
    key: 'HTTP_VERBS',
    get: function get() {
      return ['GET', 'POST', 'DELETE', 'HEAD', 'PUT', 'OPTIONS', 'PATCH'];
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'LAMBDA',
    get: function get() {
      return 'lambda';
    }

    /**
     * @returns {String}
     */
  }, {
    key: 'EXTERNAL',
    get: function get() {
      return 'external';
    }
  }]);

  return Action;
})();

exports.Action = Action;