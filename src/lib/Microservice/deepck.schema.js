/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';

let FRONTEND = 'Frontend';
let BACKEND = 'Backend';
let DOCS = 'Docs';
let MODELS = 'Models';

export default Joi.object().keys({
  identifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/),
  name: JoiHelper.string(),
  description: JoiHelper.maybeString().default('Deep Microservice'),
  version: JoiHelper.semver(),
  propertyRoot: Joi.boolean().default(false),
  author: {
    name: JoiHelper.string(),
    email: JoiHelper.email(),
    website: JoiHelper.website(),
  },
  contributors: Joi.array().items(Joi.object().keys({
    name: JoiHelper.string(),
    email: JoiHelper.email(),
    website: JoiHelper.website(),
  })),
  dependencies: Joi.object().unknown().pattern(/^[a-zA-Z0-9_-]+$/, JoiHelper.semver()),
  autoload: Joi.object().keys({
    frontend: JoiHelper.maybeString().default(FRONTEND),
    backend: JoiHelper.maybeString().default(BACKEND),
    docs: JoiHelper.maybeString().default(DOCS),
    models: JoiHelper.maybeString().default(MODELS),
  }).default({
    frontend: FRONTEND,
    backend: BACKEND,
    docs: DOCS,
    models: MODELS,
  }),
});
