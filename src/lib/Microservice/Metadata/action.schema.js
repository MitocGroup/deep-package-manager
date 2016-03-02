/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from './Action';
import Joi from 'joi';
import path from 'path';
import {JoiHelper} from '../../Helpers/JoiHelper';
import {Lambda} from '../../Property/Lambda';
import {ActionFlags} from './Helpers/ActionFlags';

export default Joi.object().keys({
  description: JoiHelper.maybeString(),
  type: JoiHelper.stringEnum([Action.LAMBDA, Action.EXTERNAL]),
  methods: JoiHelper.listEnum(Action.HTTP_VERBS),
  source: JoiHelper.string().replace(/\//gi, path.sep),
  cacheTtl: Joi.number().optional().integer().min(Action.NO_CACHE).default(Action.NO_CACHE),
  forceUserIdentity: assureTypeLambda(Joi.boolean().optional().default(true)),
  validationSchema: JoiHelper.maybeString(),
  scope: JoiHelper.stringEnum(ActionFlags.STATES_STR_VECTOR),

  // Lambda config
  engine: assureTypeLambda(Joi.object().optional().keys({
    memory: Joi.number().optional().integer().min(Lambda.DEFAULT_MEMORY_LIMIT).max(Lambda.MAX_MEMORY_LIMIT)
      .default(Lambda.DEFAULT_MEMORY_LIMIT),
    timeout: Joi.number().optional().integer().min(1).max(Lambda.MAX_TIMEOUT).default(Lambda.DEFAULT_TIMEOUT),
    runtime: Joi.string().optional().allow(Lambda.RUNTIMES).default(Lambda.DEFAULT_RUNTIME),
  }).default({
    memory: Lambda.DEFAULT_MEMORY_LIMIT,
    timeout: Lambda.DEFAULT_TIMEOUT,
    runtime: Lambda.DEFAULT_RUNTIME,
  })),
});

function assureTypeLambda(joiObject) {
  joiObject.when('type', {
    is: Action.LAMBDA, // @todo - this condition doesn't work, default engine settings are applied for external resources also
    otherwise: Joi.forbidden(),
  });

  return joiObject;
}
