/**
 * Created by AlexanderC on 6/16/15.
 */

'use strict';

import {Exception} from '../../../Exception/Exception';


/**
 * Thrown when cache cluster creation fails
 */
export class FailedToCreateElasticacheClusterException extends Exception {
    /**
     * @param {String} clusterId
     * @param {String} error
     */
  constructor(clusterId, error) {
    super(`Error on creating cache cluster "${clusterId}". ${error}`);
  }
}
