/**
 * Created by CCristi on 6/15/16.
 */

'use strict';

import {AbstractDriver} from './AbstractDriver';
import {MethodNotAllowedException} from '../Exception/MethodNotAllowedException';

export class AbstractReadonlyDriver extends AbstractDriver {
  constructor() {
    super();
  }

  /**
   * @throws MethodNotAllowedException
   */
  putObj() {
    throw new MethodNotAllowedException('putObj');
  }

  /**
   * @throws MethodNotAllowedException
   */
  deleteObj() {
    throw new MethodNotAllowedException('deleteObj');
  }

  /**
   * @throws MethodNotAllowedException
   */
  lockObj() {
    throw new MethodNotAllowedException('lockObj');
  }
  /**
   * @throws MethodNotAllowedException
   */

  releaseObjLock() {
    throw new MethodNotAllowedException('releaseObjLock');
  }

  /**
   * @throws MethodNotAllowedException
   */
  isObjLocked() {
    throw new MethodNotAllowedException('isObjLocked');
  }
}
