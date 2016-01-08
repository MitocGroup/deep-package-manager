/**
 * Created by vcernomschi on 1/5/16.
 */

'use strict';

import {S3Mock} from './S3Mock';

export default {
  S3: () => {
    return new S3Mock();
  }
};
