/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';
import {FrontendEngine} from '../Microservice/FrontendEngine';
import path from 'path';

export const FRONTEND = 'frontend';
export const BACKEND = 'backend';
export const DOCS = 'docs';

// base data path
export const DATA_BASE_DIR = 'data';
export const MODELS = path.join(DATA_BASE_DIR, 'models');
export const VALIDATION = path.join(DATA_BASE_DIR, 'validation');
export const FIXTURES = path.join(DATA_BASE_DIR, 'fixtures');
export const MIGRATION = path.join(DATA_BASE_DIR, 'migration');
export const ROLES = path.join(DATA_BASE_DIR, 'roles');

export default Joi.object().keys({
  identifier: JoiHelper.string().regex(/^[a-zA-Z0-9_\.-]+$/),
  name: JoiHelper.string(),
  description: JoiHelper.maybeString().default('Deep Microservice'),
  version: JoiHelper.semver(),
  propertyRoot: Joi.boolean().default(false),
  author: {
    name: JoiHelper.string(),
    email: JoiHelper.email(),
    website: JoiHelper.maybeString().uri(),
  },
  contributors: Joi.array().items(Joi.object().keys({
    name: JoiHelper.string(),
    email: JoiHelper.email(),
    website: JoiHelper.maybeString().uri(),
  })),
  dependencies: Joi.object().unknown().pattern(/^[a-zA-Z0-9_-]+$/, JoiHelper.semver()),
  autoload: Joi.object().keys({
    frontend: JoiHelper.maybeString().default(FRONTEND).replace(/\//gi, path.sep),
    backend: JoiHelper.maybeString().default(BACKEND).replace(/\//gi, path.sep),
    docs: JoiHelper.maybeString().default(DOCS).replace(/\//gi, path.sep),
    models: JoiHelper.maybeString().default(MODELS).replace(/\//gi, path.sep),
    validation: JoiHelper.maybeString().default(VALIDATION).replace(/\//gi, path.sep),
    fixtures:JoiHelper.maybeString().default(FIXTURES).replace(/\//gi, path.sep),
    migration: JoiHelper.maybeString().default(MIGRATION).replace(/\//gi, path.sep),
    roles: JoiHelper.maybeString().default(ROLES).replace(/\//gi, path.sep),
  }).default({
    frontend: FRONTEND,
    backend: BACKEND,
    docs: DOCS,
    models: MODELS,
    validation: VALIDATION,
    fixtures: FIXTURES,
    migration: MIGRATION,
    roles: ROLES,
  }),
  frontendEngine: Joi.array()
    .unique()
    .items(Joi.string())
    .allow(FrontendEngine.engines)
    .default([FrontendEngine.ANGULAR_ENGINE]),
  tags: Joi.array()
    .items(Joi.string())
    .default([]),
});
