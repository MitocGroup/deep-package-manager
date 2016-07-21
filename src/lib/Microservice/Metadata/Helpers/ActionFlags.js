/**
 * Created by AlexanderC on 3/2/16.
 */

'use strict';

export class ActionFlags {
  constructor() {
  }

  /**
   * @returns {Number}
   */
  static get DIRECT() {
    return 1;
  }

  /**
   * @returns {Number}
   */
  static get API() {
    return 2;
  }

  /**
   * @returns {String}
   */
  static get PUBLIC_STR() {
    return 'public';
  }

  /**
   * @returns {String}
   */
  static get PROTECTED_STR() {
    return 'protected';
  }

  /**
   * @returns {String}
   */
  static get PRIVATE_STR() {
    return 'private';
  }

  /**
   * @returns {Number}
   */
  static get PUBLIC() {
    return ActionFlags.DIRECT | ActionFlags.API;
  }

  /**
   * @returns {Number}
   */
  static get PROTECTED() {
    return ActionFlags.API;
  }

  /**
   * @returns {Number}
   */
  static get PRIVATE() {
    return ActionFlags.PUBLIC ^ ActionFlags.DIRECT ^ ActionFlags.API;
  }

  /**
   * @param {String} stateString
   * @returns {Number}
   */
  static unstringify(stateString) {
    let state = null;

    switch (stateString.toLowerCase()) {
    case ActionFlags.PUBLIC_STR:
      state = ActionFlags.PUBLIC;
      break;
    case ActionFlags.PROTECTED_STR:
      state = ActionFlags.PROTECTED;
      break;
    default: state = ActionFlags.PRIVATE;
    }

    return state;
  }

  /**
   * @returns {String[]}
   */
  static get STATES_STR_VECTOR() {
    return [ActionFlags.PUBLIC_STR, ActionFlags.PROTECTED_STR, ActionFlags.PRIVATE_STR,];
  }

  /**
   * @param {Number} state
   * @returns {String}
   */
  static stringify(state) {
    if (ActionFlags.isApi(state) && ActionFlags.isDirect(state)) {
      return ActionFlags.PUBLIC_STR;
    } else if (ActionFlags.isApi(state)) {
      return ActionFlags.PROTECTED_STR;
    }

    return ActionFlags.PRIVATE_STR;
  }

  /**
   * @param {Number} value
   * @returns {Boolean}
   */
  static isDirect(value) {
    return !!(value & ActionFlags.DIRECT);
  }

  /**
   * @param {Number} value
   * @returns {Boolean}
   */
  static isApi(value) {
    return !!(value & ActionFlags.API);
  }

  /**
   * @returns {Function}
   */
  static get API_ACTION_FILTER() {
    return (action) => ActionFlags.isApi(action.scope);
  }

  /**
   * @returns {Function}
   */
  static get NON_DIRECT_ACTION_FILTER() {
    return (action) => !ActionFlags.DIRECT_ACTION_FILTER(action);
  }

  /**
   * @returns {Function}
   */
  static get DIRECT_ACTION_FILTER() {
    return (action) => ActionFlags.isDirect(action.scope);
  }
}
