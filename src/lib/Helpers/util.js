/**
 * Created by AlexanderC on 2/12/16.
 */

/*eslint  no-eq-null: 0, eqeqeq:0*/

import util from 'util';

export default util._extend(util, {
  /**
   * @param {*} o
   * @returns {Boolean}
   */
  isObject: util.isObject || ((o) => {
    return o != null && typeof o === 'object' && !Array.isArray(o);
  }),
});
