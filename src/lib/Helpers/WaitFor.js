/**
 * Created by AlexanderC on 6/3/15.
 */

'use strict';

import {InvalidArgumentException} from '../Exception/InvalidArgumentException';


/**
 * Wait for something
 */
export class WaitFor {
  constructor() {
    this._stack = [];
    this._toSkip = [];
    this._children = [];
  }

  /**
   * @returns {Number}
   */
  get childrenCount() {
    return this._children.length;
  }

  /**
   * @returns {Array}
   */
  get children() {
    return this._children;
  }

  /**
   * @param {WaitFor} child
   * @returns {WaitFor}
   */
  addChild(child) {
    if (!(child instanceof WaitFor)) {
      throw new InvalidArgumentException(child, WaitFor);
    }

    this._children.push(child);

    return this;
  }

  /**
   * @param {Number} index
   * @returns {WaitFor}
   */
  child(index) {
    if (this.childrenCount < index) {
      throw new InvalidArgumentException(index, 'existing index');
    }

    return this._children[index];
  }

  /**
   * @returns {Number}
   */
  get count() {
    return this._stack.length;
  }

  /**
   * @returns {Number}
   */
  get remaining() {
    return this._stack.length - this._toSkip.length;
  }

  /**
   * @param {Function} condition
   * @returns {WaitFor}
   */
  push(condition) {
    if (!(condition instanceof Function)) {
      throw new InvalidArgumentException(condition, 'Function');
    }

    this._stack.push(condition);

    return this;
  }

  /**
   * @param {Function} callback
   */
  ready(callback) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    let skipStack = [];

    for (let i = 0; i < this.count; i++) {
      let condition = this._stack[i];

      if (condition()) {
        this._toSkip.push(condition);
        skipStack.push(i);
      }
    }

    for (let i of skipStack) {
      delete this._stack[i];
    }

    if (this.remaining > 0) {
      setTimeout(function() {
        this.ready(callback);
      }.bind(this), WaitFor.TICK_TTL);
    } else {
      this._readyChildren(callback, 0);
    }
  }

  /**
   * @param {Function} callback
   * @param {Number} level
   */
  _readyChildren(callback, level) {
    let remaining = this._children.length - level;

    if (remaining <= 0) {
      callback();
      return;
    }

    let subWait = new WaitFor();

    for (let child of this._children) {
      child.ready(function() {
        remaining--;
      }.bind(this));

      level++;
    }

    subWait.push(function() {
      return remaining <= 0;
    }.bind(this));

    subWait.ready(function() {
      this._readyChildren(callback, level + 1);
    }.bind(this));
  }

  /**
   * @returns {Number}
   */
  static get TICK_TTL() {
    return 100;
  }
}
