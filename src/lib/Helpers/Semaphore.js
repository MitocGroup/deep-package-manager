/**
 * Created by AlexanderC on 5/5/17.
 */

'use strict';

export class Semaphore {
  
  /**
   * @param {String} name
   * @param {Number} interval
   */
  constructor(name = Semaphore.DEFAULT_NAME, interval = Semaphore.INTERVAL) {
    this._name = name;
    this._interval = interval;
    this._execVector = {};
  }
  
  /**
   * @returns {Number}
   */
  get interval() {
    return this._interval;
  }
  
  /**
   * @returns {String}
   */
  get name() {
    return this._name;
  }
  
  /**
   * @param {Promise|*} promiseCb
   * @param {*} id
   *
   * @returns {Promise|*}
   */
  wrap(promiseCb, id) {    
    return this._process(id)
      .then(() => promiseCb())
      .then(result => {
        delete this._execVector[id];
        
        return Promise.resolve(result);
      });
  }
  
  /**
   * @param {*} id
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _process(id) {
    if (!this._execVector.hasOwnProperty(id)) {
      this._execVector[id] = true;
      
      return Promise.resolve();
    }
    
    return this._greenLight(id);
  }
  
  /**
   * @param {*} id
   *
   * @returns {Promise|*}
   *
   * @private
   */
  _greenLight(id) {
    return new Promise(resolve => {
      console.debug(`[${this.name}] Red light for #{${id}}`);
      
      const interval = setInterval(() => {
        if (!this._execVector.hasOwnProperty(id)) {
          console.debug(`[${this.name}] Green light for #{${id}}`);
          
          this._execVector[id] = true;
          clearInterval(interval);
          
          return process.nextTick(() => resolve());
        }
      }, this.interval);
    });
  }
  
  /**
   * @returns {String}
   */
  static get DEFAULT_NAME() {
    return 'SEMAPHORE';
  }
  
  /**
   * @returns {Number}
   */
  static get INTERVAL() {
    return 200;
  }
}
