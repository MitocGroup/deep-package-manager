/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Exception} from '../../Exception/Exception';

/**
 * throws when duplicate property root found
 */
export class DuplicateRootException extends Exception {
    /**
     * @param {Microservice} rootMicroservice
     * @param {Microservice} microservice
     */
  constructor(rootMicroservice, microservice) {
    let identifier = rootMicroservice.config.identifier;
    let duplicateIdentifier = microservice.config.identifier;

    super(`Duplicate root microservice ${duplicateIdentifier} (previously set up ${identifier})`);
  }
}
