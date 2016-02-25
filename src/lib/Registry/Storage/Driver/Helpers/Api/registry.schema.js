/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import Joi from 'joi';

export default Joi.object().keys({
  hasObj: Joi.string().uri({schema: [/https?/],}).required(),
  readObj: Joi.string().uri({schema: [/https?/],}).required(),
  putObj: Joi.string().uri({schema: [/https?/],}).required(),
  deleteObj: Joi.string().uri({schema: [/https?/],}).required(),
});
