/**
 * Created by vcernomschi on 10/19/15.
 */

'use strict';

import {Instance as PropertyInstance} from '../../../lib.compiled/Property/Instance';
import {Instance as MicroserviceInstance} from '../../../lib.compiled/Microservice/Instance';
import {Parameters} from '../../../lib.compiled/Microservice/Parameters';
import {Config} from '../../../lib.compiled/Microservice/Config';

/**
 * Property instance
 */
export class PropertyInstanceMock extends PropertyInstance {
  /**
   * @param {String} path
   * @param {String} configFileName
   */
  constructor(path, configFileName = Config.DEFAULT_FILENAME) {
    super(path, configFileName);
  }

  get microservices() {
    if (this._microservices === null) {
      this._microservices = [];

      let configInput = {
        name: 'config',
        propertyRoot: false,
        description: 'Config unit test',
        identifier: 'unit_test',
        version: '0.0.1',
        dependencies: {},
        autoload: {
          backend: 'Backend',
          docs: 'Docs',
          frontend: 'Frontend',
          models: 'Models',
        },
      };
      let config = new Config(configInput);
      let parameters = new Parameters();
      let basePath = 'basePath';

      this._microservices.push(new MicroserviceInstance(config, parameters, basePath));
    }

    return this._microservices;
  }
}
