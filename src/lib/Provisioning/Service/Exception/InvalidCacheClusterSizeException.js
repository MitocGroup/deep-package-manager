/**
 * Created by mgoria on 15/12/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';

/**
 * Throws when an invalid cache cluster size is set
 */
export class InvalidCacheClusterSizeException extends Exception {
  /**
   * @param {String} cacheSize
   * @param {Array} availableSizes
   */
  constructor(cacheSize, availableSizes) {
    super(`Invalid API Gateway cache cluster size "${cacheSize}". Available sizes "${availableSizes.join(', ')}".`);
  }
}
