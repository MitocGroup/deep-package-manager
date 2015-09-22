/**
 * Created by AlexanderC on 5/27/15.
 */

'use strict';

import AWS from 'aws-sdk';
import StringUtils from 'underscore.string';
import FileSystem from 'fs';
import Path from 'path';
import {Instance as Provisioning} from '../Provisioning/Instance';
import {Exception} from '../Exception/Exception';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {Instance as Microservice} from '../Microservice/Instance';
import {DuplicateRootException} from './Exception/DuplicateRootException';
import {MissingRootException} from './Exception/MissingRootException';
import {Lambda} from './Lambda';
import {WaitFor} from '../Helpers/WaitFor';
import {Frontend} from './Frontend';
import {Model} from './Model';
import {S3Service} from '../Provisioning/Service/S3Service';
import {Config} from './Config';
import {Hash} from '../Helpers/Hash';

/**
 * Property instance
 */
export class Instance {
  /**
   * @param {String} path
   * @param {String} configFileName
   */
  constructor(path, configFileName = Config.DEFAULT_FILENAME) {
    let configFile = Path.join(path, configFileName);

    if (!FileSystem.existsSync(configFile)) {
      throw new Exception(`Missing ${configFileName} configuration file from ${path}.`);
    }

    this._config = Config.createFromJsonFile(configFile).extract();

    // @todo: improve this!
    this._config.deployId = Hash.md5(`${this._config.propertyIdentifier}#${new Date().getTime()}`);

    this._aws = AWS;
    AWS.config.update(this._config.aws);

    this._path = StringUtils.rtrim(path, '/');
    this._microservices = null;
    this._localDeploy = false;
    this._provisioning = new Provisioning(this);
  }

  /**
   * Max number of concurrent async processes to run
   * @returns {number}
   */
  static get concurrentAsyncCount() {
    return 3;
  }

  /**
   * @returns {Boolean}
   */
  get localDeploy() {
    return this._localDeploy;
  }

  /**
   * @param {Boolean} state
   */
  set localDeploy(state) {
    this._localDeploy = state;
  }

  /**
   * @returns {Object}
   */
  get config() {
    return this._config;
  }

  /**
   * @returns {String}
   */
  get path() {
    return this._path;
  }

  /**
   * @returns {String}
   */
  get identifier() {
    return this._config.propertyIdentifier;
  }

  /**
   * @returns {AWS}
   */
  get AWS() {
    return this._aws;
  }

  /**
   * @returns {Provisioning}
   */
  get provisioning() {
    return this._provisioning;
  }

  /**
   * This is mainly used by dev server!
   *
   * @returns {Object}
   */
  fakeBuild() {
    let microservicesConfig = {};
    let microservices = this.microservices;
    var rootMicroservice;

    for (let microservice of microservices) {
      if (microservice.isRoot) {
        if (rootMicroservice) {
          throw new DuplicateRootException(rootMicroservice, microservice);
        }

        // @todo: set it from other place?
        this._config.globals = microservice.parameters.globals || {};

        rootMicroservice = microservice;
      }
    }

    if (!rootMicroservice) {
      throw new MissingRootException();
    }

    let modelsDirs = [];

    for (let microservice of microservices) {
      microservice.compile();

      let microserviceConfig = {
        identifier: microservice.config.identifier,
        localPath: microservice.basePath,
        resources: microservice.resources.extract(),
        parameters: microservice.parameters,
        raw: microservice.config,
        isRoot: microservice.isRoot,
        autoload: microservice.autoload.extract(),
        lambdas: {},
        deployedServices: {
          lambdas: {},
        },
      };

      microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

      modelsDirs.push(microservice.autoload.models);
    }

    this._config.microservices = microservicesConfig;

    let models = Model.create(...modelsDirs);

    this._config.models = models.map(m => m.extract());

    let lambdaInstances = [];

    for (let microserviceIdentifier in this._config.microservices) {
      if (!this._config.microservices.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = this._config.microservices[microserviceIdentifier];

      for (let lambdaIdentifier in microservice.raw.lambdas) {
        if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier)) {
          continue;
        }

        let lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
        let lambdaExecRole = '';

        let lambdaInstance = new Lambda(
          this,
          microserviceIdentifier,
          lambdaIdentifier,
          `${microserviceIdentifier}-${lambdaIdentifier}`,
          lambdaExecRole,
          lambdaPath
        );

        this._config
          .microservices[microserviceIdentifier]
          .lambdas[lambdaIdentifier] = {
          name: lambdaInstance.functionName,
          region: lambdaInstance.region,
        };

        lambdaInstances.push(lambdaInstance);
      }
    }

    let lambdas = {};
    for (let lambdaInstance of lambdaInstances) {
      lambdas[lambdaInstance.functionName] = lambdaInstance.createConfig(this._config);

      // @todo: remove this hook?
      lambdas[lambdaInstance.functionName].name = lambdaInstance.functionName;
      lambdas[lambdaInstance.functionName].path = Path.join(lambdaInstance.path, 'bootstrap.js');
    }

    return lambdas;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} skipProvision
   * @returns {Instance}
   */
  build(callback, skipProvision) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    console.log(`- Start building property: ${new Date().toTimeString()}`);

    let microservicesConfig = {};
    let microservices = this.microservices;
    var rootMicroservice;

    for (let microservice of microservices) {
      if (microservice.isRoot) {
        if (rootMicroservice) {
          throw new DuplicateRootException(rootMicroservice, microservice);
        }

        rootMicroservice = microservice;

        // @todo: set it from other place?
        this._config.globals = microservice.parameters.globals || {};
      }
    }

    if (!rootMicroservice) {
      throw new MissingRootException();
    }

    let modelsDirs = [];

    for (let microservice of microservices) {
      microservice.compile();

      let microserviceConfig = {
        identifier: microservice.config.identifier,
        localPath: microservice.basePath,
        resources: microservice.resources.extract(),
        parameters: microservice.parameters,
        raw: microservice.config,
        isRoot: microservice.isRoot,
        autoload: microservice.autoload.extract(),
        lambdas: {},
        deployedServices: {
          lambdas: {},
        },
      };

      microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

      modelsDirs.push(microservice.autoload.models);
    }

    this._config.microservices = microservicesConfig;

    let models = Model.create(...modelsDirs);

    this._config.models = models.map(m => m.extract());

    if (skipProvision) {
      callback();
    } else {
      console.log(`- Start provisioning: ${new Date().toTimeString()}`);

      this.provisioning.create(function(config) {
        this._config.provisioning = config;

        console.log(`- Provisioning is done!: ${new Date().toTimeString()}`);

        callback();
      }.bind(this));
    }

    return this;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} isUpdate
   * @returns {Instance}
   */
  deploy(callback, isUpdate = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    console.log(`- Start deploying!: ${new Date().toTimeString()}`);

    let lambdas = [];
    let lambdaExecRoles = this._config.provisioning.lambda.executionRoles;
    let lambdaNames = this._config.provisioning.lambda.names;

    for (let microserviceIdentifier in this._config.microservices) {
      if (!this._config.microservices.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = this._config.microservices[microserviceIdentifier];

      for (let lambdaIdentifier in microservice.raw.lambdas) {
        if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier)) {
          continue;
        }

        let lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
        let lambdaExecRole = lambdaExecRoles[microserviceIdentifier][lambdaIdentifier];
        let lambdaName = lambdaNames[microserviceIdentifier][lambdaIdentifier];

        let lambdaInstance = new Lambda(
          this,
          microserviceIdentifier,
          lambdaIdentifier,
          lambdaName,
          lambdaExecRole,
          lambdaPath
        );

        this._config
          .microservices[microserviceIdentifier]
          .lambdas[lambdaIdentifier] = {
          name: lambdaInstance.functionName,
          region: lambdaInstance.region,
        };

        lambdas.push(lambdaInstance);
      }
    }

    let wait = new WaitFor();
    let concurrentCount = this.constructor.concurrentAsyncCount;
    let remaining = 0;

    // @todo: setup lambda defaults (memory size, timeout etc.)
    let asyncLambdaActions = lambdas.map(function(lambda) {
      return function() {
        let deployedLambdasConfig = this._config.microservices[lambda.microserviceIdentifier].deployedServices.lambdas;

        if (isUpdate) {
          if (this._localDeploy) {
            lambda.pack().ready(function() {
              remaining--;
            }.bind(this));
          } else {
            lambda.update(function() {
              deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
              remaining--;
            }.bind(this));
          }
        } else {
          lambda.deploy(function() {
            deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
            remaining--;
          }.bind(this));
        }
      }.bind(this);
    }.bind(this));

    let hasNextBatch = !!asyncLambdaActions.length;

    function processAsyncLambdaBatch() {
      if (asyncLambdaActions.length) {
        let stack = asyncLambdaActions.splice(0, concurrentCount);
        let stackItem;
        remaining = stack.length;

        for (stackItem of stack) {
          stackItem();
        }

        if (!asyncLambdaActions.length) {
          hasNextBatch = false;
        }
      } else {
        hasNextBatch = false;
      }
    }

    wait.push(function() {
      if (remaining === 0) {
        if (hasNextBatch) {
          processAsyncLambdaBatch();
          return false;
        } else {
          return true;
        }
      }

      return false;
    }.bind(this));

    wait.ready(function() {
      let frontend = new Frontend(this._config.microservices, this._path);
      let publicBucket = this._config.provisioning.s3.buckets[S3Service.PUBLIC_BUCKET].name;

      frontend.build(Frontend.createConfig(this._config));

      if (isUpdate && this._localDeploy) {
        callback();
      } else {
        console.log(`- Start deploying frontend!: ${new Date().toTimeString()}`);
        frontend.deploy(this._aws, publicBucket).ready(callback);
      }
    }.bind(this));

    return this;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} isUpdate
   * @returns {Instance}
   * @private
   */
  _postDeploy(callback, isUpdate = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    if (isUpdate) {
      this._runPostDeployMsHooks(callback, true);
    } else {
      this.provisioning.postDeployProvision(function(config) {
        this._config.provisioning = config;

        this._runPostDeployMsHooks(callback);
      }.bind(this));
    }

    return this;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} isUpdate
   * @returns {Instance}
   * @private
   */
  _runPostDeployMsHooks(callback, isUpdate = false) {
    let wait = new WaitFor();
    let microservices = this.microservices;
    let remaining = microservices.length;

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    for (let microservice of microservices) {
      let hook = microservice.postDeployHook;

      if (!hook) {
        console.log(`- No post deploy hook found for microservice ${microservice.identifier}`);
        remaining--;
        continue;
      }

      console.log(`- Running post deploy hook for microservice ${microservice.identifier}`);

      hook(this._config.provisioning, isUpdate, function() {
        remaining--;
      }.bind(this));
    }

    wait.ready(function() {
      callback();
    }.bind(this));

    return this;
  }

  /**
   * @param {Object} propertyConfigSnapshot
   * @param {Function} callback
   * @returns {Instance}
   */
  update(propertyConfigSnapshot, callback) {
    this._config = propertyConfigSnapshot;

    return this.install(callback, true);
  }

  /**
   * @param {Function} callback
   * @param {Boolean} skipProvision
   * @returns {Instance}
   */
  install(callback, skipProvision) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    console.log(`- Start ${skipProvision ? 'updating' : 'installing'} property: ${new Date().toTimeString()}`);

    return this.build(function() {
      this.deploy(function() {
        console.log(`- Deploy is done!: ${new Date().toTimeString()}`);

        this._postDeploy(callback, skipProvision);
      }.bind(this), skipProvision);
    }.bind(this), skipProvision);
  }

  /**
   * @returns {Microservice[]}
   */
  get microservices() {
    if (this._microservices === null) {
      this._microservices = [];

      let files = FileSystem.readdirSync(this._path);

      for (let file of files) {
        let fullPath = Path.join(this._path, file);

        if (FileSystem.statSync(fullPath).isDirectory()
          && FileSystem.existsSync(Path.join(fullPath, Microservice.CONFIG_FILE))) {
          this._microservices.push(Microservice.create(fullPath));
        }
      }
    }

    return this._microservices;
  }
}
