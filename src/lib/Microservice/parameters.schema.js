/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';

export default Joi.object().keys({
  globals: Joi.object().unknown().optional(),
  backend: Joi.object().unknown(),
  frontend: Joi.object().unknown(),
});
