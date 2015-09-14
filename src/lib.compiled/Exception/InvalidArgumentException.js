/**
 * Created by AlexanderC on 5/25/15.
 */

"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Exception2 = require('./Exception');

/**
 * throws when invalid argument provided
 */

var InvalidArgumentException = (function (_Exception) {
  _inherits(InvalidArgumentException, _Exception);

  /**
   * @param {*} argument
   * @param {String} meantType
   */

  function InvalidArgumentException(argument, meantType) {
    _classCallCheck(this, InvalidArgumentException);

    var argumentType = typeof argument;

    _get(Object.getPrototypeOf(InvalidArgumentException.prototype), "constructor", this).call(this, "Invalid argument " + argument + " of type " + argumentType + " provided (meant " + meantType + ").");
  }

  return InvalidArgumentException;
})(_Exception2.Exception);

exports.InvalidArgumentException = InvalidArgumentException;