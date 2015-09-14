/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import {Action} from './Action';
import Joi from 'joi';
import {JoiHelper} from '../../Helpers/JoiHelper';

export default Joi.object().keys({
  description: JoiHelper.maybeString(),
  type: JoiHelper.stringEnum([Action.LAMBDA, Action.EXTERNAL]),
  methods: JoiHelper.listEnum(Action.HTTP_VERBS),
  source: JoiHelper.string(),
});
