/**
 * Created by AlexanderC on 5/25/15.
 */

'use strict';

import Joi from 'joi';
import {JoiHelper} from '../Helpers/JoiHelper';
import {CloudSearchService} from '../Provisioning/Service/CloudSearchService';

export default Joi.object()
  .unknown(true)
  .pattern(/^[a-zA-Z0-9_]+$/, Joi.object().keys({
    timestamp: Joi.boolean().default(true),
    indexes: Joi.object()
      .unknown(true)
      .optional()
      .default({})
      .pattern(/^[a-zA-Z0-9_]+$/, Joi.object().keys({
        type: JoiHelper.maybeString()
          .default(CloudSearchService.DEFAULT_IDX_TYPE)
          .allow(CloudSearchService.ALLOWED_IDX_TYPES),
        options: Joi.object().optional().unknown(true),
        autocomplete: Joi.object().optional().keys({
          fuzziness: Joi.string()
            .optional()
            .default(CloudSearchService.ALLOWED_FUZZINESS[0])
            .allow(CloudSearchService.ALLOWED_FUZZINESS),
        }),
      })),
  }));
