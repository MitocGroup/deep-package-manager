/**
 * Created by AlexanderC on 2/19/16.
 */

/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';

export default Joi.object().keys({
  name: Joi.string().required(),
  zipball_url: Joi.string().uri().required(),
  tarball_url: Joi.string().uri().required(),
  commit: Joi.object().keys({
    sha: Joi.string().regex(/^[a-z0-9]+$/i).required(),
    url: Joi.string().uri().required(),
  }),
});
