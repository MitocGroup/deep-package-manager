/**
 * Created by CCristi on 7/11/16.
 */

'use strict';

import {RegistryException} from '../../../../../Exception/RegistryException';
import os from 'os';

export class GitHubRateExceededException extends RegistryException {
  constructor() {
    super(
      'GitHub: Api Rate Limit exceeded.' +
      os.EOL.repeat(2) +
      'You can setup your github access token by running "deepify registry config github --set {username}:{token}"' +
      os.EOL.repeat(2) +
      'Creating a github access token for cli use: ' + 
      'https://help.github.com/articles/creating-an-access-token-for-command-line-use/' +
      os.EOL
    );
  }
}
