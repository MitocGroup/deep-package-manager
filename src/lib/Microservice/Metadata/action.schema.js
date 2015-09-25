/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from './Action';
import Joi from 'joi';
import {JoiHelper} from '../../Helpers/JoiHelper';
import {Lambda} from '../../Property/Lambda';

export default Joi.object().keys({
  description: JoiHelper.maybeString(),
  type: JoiHelper.stringEnum([Action.LAMBDA, Action.EXTERNAL]),
  methods: JoiHelper.listEnum(Action.HTTP_VERBS),
  source: JoiHelper.string(),

  // Lambda config
  engine: Joi.object().optional().keys({
    memory: Joi.number().integer().min(128).max(1536).default(Lambda.DEFAULT_MEMORY_LIMIT),
    timeout: Joi.number().integer().min(1).max(Lambda.MAX_TIMEOUT).default(Lambda.DEFAULT_TIMEOUT),
    runtime: Joi.string().optional().allow(Lambda.RUNTIMES).default(Lambda.DEFAULT_RUNTIME),
  }).default({
    memory: Lambda.DEFAULT_MEMORY_LIMIT,
    timeout: Lambda.DEFAULT_TIMEOUT,
    runtime: Lambda.DEFAULT_RUNTIME,
  }).when('type', {
    is: Action.LAMBDA,
    otherwise: Joi.any().forbidden(),
  }),
});
