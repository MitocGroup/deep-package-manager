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
import {FrontendEngine} from '../Microservice/FrontendEngine';
import {NoMatchingFrontendEngineException} from '../Dependencies/Exception/NoMatchingFrontendEngineException';
import {exec} from 'child_process';
import OS from 'os';
import objectMerge from 'object-merge';

/**
 * Property instance
 */
export class Instance {
  /**
   * @param {String} path
   * @param {String|Object} config
   */
  constructor(path, config = Config.DEFAULT_FILENAME) {
    this._config = Instance._createConfigObject(config, path).extract();

    this.deployId = Hash.md5(`${this._config.appIdentifier}#${new Date().getTime()}`);

    this._aws = AWS;
    AWS.config.update(this._config.aws);

    this._path = StringUtils.rtrim(path, '/');
    this._microservices = null;
    this._localDeploy = false;
    this._provisioning = new Provisioning(this);
    this._isUpdate = false;

    this._microservicesToUpdate = [];
  }

  /**
   * @returns {Microservice[]}
   */
  get microservicesToUpdate() {
    return this._microservicesToUpdate;
  }

  /**
   * @param {Microservice[]} microservices
   */
  set microservicesToUpdate(microservices) {
    this._microservicesToUpdate = microservices.map(
      (ms) => typeof ms === 'string' ? this.microservice(ms) : ms
    );
  }

  /**
   * @param {String|Object} config
   * @param {String} path
   * @returns {Config}
   * @private
   */
  static _createConfigObject(config, path) {
    if (typeof config === 'string') {
      let configFile = Path.join(path, config);

      if (!FileSystem.existsSync(configFile)) {
        throw new Exception(`Missing ${config} configuration file from ${path}.`);
      }

      return Config.createFromJsonFile(configFile);
    }

    return new Config(config);
  }

  /**
   * @returns {String}
   */
  get deployId() {
    return this._config.deployId;
  }

  /**
   * @param {String} id
   */
  set deployId(id) {
    this._config.deployId = id;
  }

  /**
   * Max number of concurrent async processes to run
   *
   * @returns {Number}
   */
  static get concurrentAsyncCount() {
    return 3;
  }

  /**
   * @returns {Boolean}
   */
  get isUpdate() {
    return this._isUpdate;
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
    return this._config.appIdentifier;
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
        if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier) || lambdaIdentifier === '_') {
          continue;
        }

        let lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
        let lambdaOptions = microservice.raw.lambdas._[lambdaIdentifier];
        let lambdaExecRole = '';

        let lambdaInstance = new Lambda(
          this,
          microserviceIdentifier,
          lambdaIdentifier,
          `${microserviceIdentifier}-${lambdaIdentifier}`,
          lambdaExecRole,
          lambdaPath
        );

        lambdaInstance.memorySize = lambdaOptions.memory;
        lambdaInstance.timeout = lambdaOptions.timeout;
        lambdaInstance.runtime = lambdaOptions.runtime;

        // avoid authentication errors on local machine
        lambdaInstance.forceUserIdentity = false;

        this._config
          .microservices[microserviceIdentifier]
          .lambdas[lambdaIdentifier] = {
          arn: lambdaInstance.arn,
          name: lambdaInstance.functionName,
          region: lambdaInstance.region,
        };

        lambdaInstances.push(lambdaInstance);
      }
    }

    let lambdas = {};
    for (let lambdaInstance of lambdaInstances) {
      lambdas[lambdaInstance.arn] = lambdaInstance.createConfig(this._config);
      lambdas[lambdaInstance.arn].name = lambdaInstance.functionName;
      lambdas[lambdaInstance.arn].path = Path.join(lambdaInstance.path, 'bootstrap.js');
    }

    return lambdas;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} skipProvision
   * @returns {Instance}
   */
  build(callback, skipProvision = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    let isUpdate = this._isUpdate;

    console.log(`Start building application`);

    let microservicesConfig = isUpdate ? this._config.microservices : {};
    let microservices = this.microservices;
    let rootMicroservice;

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

      if (isUpdate) {
        microserviceConfig.deployedServices = microservicesConfig[microservice.config.identifier].deployedServices;
      }

      microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

      modelsDirs.push(microservice.autoload.models);
    }

    this._config.microservices = microservicesConfig;

    let models = Model.create(...modelsDirs);

    this._config.models = models.map(m => m.extract());

    if (skipProvision) {
      callback();
    } else {
      console.log(`Start ${isUpdate ? 'updating' : 'creating'} provisioning`);

      this.provisioning.create(function(config) {
        this._config.provisioning = config;

        console.log(`Provisioning is done`);

        callback();
      }.bind(this), isUpdate);
    }

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  deploy(callback) {
    let isUpdate = this._isUpdate;

    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    console.log(`Start deploying backend`);

    let lambdas = [];
    let lambdaExecRoles = this._config.provisioning.lambda.executionRoles;
    let lambdaNames = this._config.provisioning.lambda.names;

    for (let microserviceIdentifier in this._config.microservices) {
      if (!this._config.microservices.hasOwnProperty(microserviceIdentifier)) {
        continue;
      }

      let microservice = this._config.microservices[microserviceIdentifier];

      for (let lambdaIdentifier in microservice.raw.lambdas) {
        if (!microservice.raw.lambdas.hasOwnProperty(lambdaIdentifier) || lambdaIdentifier === '_') {
          continue;
        }

        let lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
        let lambdaOptions = microservice.raw.lambdas._[lambdaIdentifier];

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

        lambdaInstance.memorySize = lambdaOptions.memory;
        lambdaInstance.timeout = lambdaOptions.timeout;
        lambdaInstance.runtime = lambdaOptions.runtime;
        lambdaInstance.forceUserIdentity = lambdaOptions.forceUserIdentity;

        this._config
          .microservices[microserviceIdentifier]
          .lambdas[lambdaIdentifier] = {
            name: lambdaInstance.functionName,
            region: lambdaInstance.region,
            arn: lambdaInstance.arn,
          };

        lambdas.push(lambdaInstance);
      }
    }

    let wait = new WaitFor();
    let concurrentCount = this.constructor.concurrentAsyncCount;
    let remaining = 0;

    // @todo: setup lambda defaults (memory size, timeout etc.)
    let asyncLambdaActions = lambdas.map((lambda) => {
      return () => {
        let deployedLambdasConfig = this._config.microservices[lambda.microserviceIdentifier].deployedServices.lambdas;

        if (!this.isWorkingMicroservice(lambda.microserviceIdentifier)) {
          remaining--;
          return;
        }

        if (isUpdate) {
          if (this._localDeploy) {
            lambda.pack().ready(() => {
              remaining--;
            });
          } else {
            lambda.update(() => {
              deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
              remaining--;
            });
          }
        } else {
          lambda.deploy(() => {
            deployedLambdasConfig[lambda.identifier] = lambda.uploadedLambda;
            remaining--;
          });
        }
      };
    });

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
      this.buildFrontend(this._path, (frontend, error) => {
        if (error) {
          console.error(
            `Error while injecting deploy ID into the assets: ${error}`
          );
        }

        let publicBucket = this._config.provisioning.s3.buckets[S3Service.PUBLIC_BUCKET].name;

        if (isUpdate && this._localDeploy) {
          callback();
        } else {
          console.log(`Start deploying frontend`);

          frontend.deploy(this._aws, publicBucket).ready(callback);
        }
      });
    }.bind(this));

    return this;
  }

  /**
   * @param {String} dumpPath
   * @param {Function} callback
   * @returns {Frontend}
   */
  buildFrontend(dumpPath = null, callback = () => {}) {
    let frontend = new Frontend(this._config.microservices, dumpPath || this._path, this.deployId);

    frontend.build(Frontend.createConfig(this._config), callback.bind(this, frontend));

    return frontend;
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  postDeploy(callback) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    this.provisioning.postDeployProvision(function(config) {
      this._config.provisioning = config;
      this._runPostDeployMsHooks(callback);
    }.bind(this), this._isUpdate);

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   * @private
   */
  runInitMsHooks(callback) {
    let wait = new WaitFor();
    let microservices = this.microservices;
    let remaining = microservices.length;

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    for (let microservice of microservices) {
      let hook = microservice.initHook;

      if (!hook) {
        console.log(`No init hook found for microservice ${microservice.identifier}`);
        remaining--;
        continue;
      }

      console.log(`Running init hook for microservice ${microservice.identifier}`);

      hook(function() {
        remaining--;
      }.bind(this));
    }

    wait.ready(function() {
      callback();
    }.bind(this));

    return this;
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   * @private
   */
  _runPostDeployMsHooks(callback) {
    let wait = new WaitFor();
    let microservices = this.microservices;
    let remaining = microservices.length;

    wait.push(function() {
      return remaining <= 0;
    }.bind(this));

    for (let microservice of microservices) {
      let hook = microservice.postDeployHook;

      if (!hook) {
        console.log(`No post deploy hook found for microservice ${microservice.identifier}`);
        remaining--;
        continue;
      }

      console.log(`Running post deploy hook for microservice ${microservice.identifier}`);

      hook(this._provisioning, this._isUpdate, function() {
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
   * @param {Microservice[]} microservicesToUpdate
   * @returns {Instance}
   */
  update(propertyConfigSnapshot, callback, microservicesToUpdate = []) {
    this._isUpdate = true;
    this.microservicesToUpdate = microservicesToUpdate;
    this._config = propertyConfigSnapshot;

    // @todo: does it work?
    this._provisioning.config = this._config.provisioning;

    return this.install((...args) => {
      this._isUpdate = false;

      callback(...args);
    });
  }

  /**
   * @param {Function} callback
   * @param {Boolean} skipProvision
   * @returns {Instance}
   */
  install(callback, skipProvision = false) {
    if (!(callback instanceof Function)) {
      throw new InvalidArgumentException(callback, 'Function');
    }

    console.log(`Start ${this._isUpdate ? 'updating' : 'installing'} application`);

    return this.build(function() {
      console.log(`Build is done`);

      this.deploy(function() {
        console.log(`Deploy is done`);

        this.postDeploy(callback);
      }.bind(this));
    }.bind(this), skipProvision);
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  assureFrontendEngine(callback) {
    let microservices = this.microservices;

    for (let microservice of microservices) {
      if (microservice.isRoot) {
        callback(null, null);
        return this;
      }
    }

    return this.fetchFrontendEngine(callback);
  }

  /**
   * @todo: force it for local use only?
   *
   * @param {Function} callback
   * @returns {Instance}
   */
  fetchFrontendEngine(callback) {
    let frontendEngineManager = new FrontendEngine();
    let microservices = this.microservices;

    let suitableEngine = frontendEngineManager.findSuitable(...microservices);

    if (!suitableEngine) {
      throw new NoMatchingFrontendEngineException(frontendEngineManager.rawEngines);
    }

    let engineRepo = FrontendEngine.getEngineRepository(suitableEngine);

    console.log(`Checking out the frontend engine '${suitableEngine}' from '${engineRepo}'`);

    let tmpDir = OS.tmpdir();
    let repoName = engineRepo.replace(/^.+\/([^\/]+)\.git$/i, '$1');
    let repoDir = Path.join(tmpDir, repoName);

    // @todo: replace it with https://www.npmjs.com/package/nodegit
    exec(`rm -rf ${repoDir}; git clone --depth=1 ${engineRepo} ${repoDir}`, (error, stdout, stderr) => {
      if (error) {
        callback(error, engineRepo);
        return;
      }

      exec(`cp -R ${repoDir}/src/* ${this._path}/`, (error, stdout, stderr) => {
        this._microservices = null; // @todo: reset microservices?

        callback(error, engineRepo);
      });
    });

    return this;
  }

  /**
   * @param {String[]|String} identifiers
   * @returns {Microservice[]|Microservice|null}
   */
  microservice(...identifiers) {
    let matchedMicroservices = [];

    for (let i in this.microservices) {
      if (!this.microservices.hasOwnProperty(i)) {
        continue;
      }
      
      let microservice = this.microservices[i];
      
      if (identifiers.indexOf(microservice.identifier) !== -1) {
        if (identifiers.length === 1) {
          return microservice;
        }

        matchedMicroservices.push(microservice);
      }
    }

    if (identifiers.length === 1 && matchedMicroservices.length <= 0) {
      return null;
    }

    return identifiers.length === 1 ? matchedMicroservices[0] : matchedMicroservices;
  }

  /**
   * @returns {Microservice[]}
   */
  get skippedMicroservices() {
    if (this._microservicesToUpdate.length <= 0) {
      return [];
    }

    return this.microservices
      .filter(
        (microserviceInstance) =>  this._microservicesToUpdate.indexOf(microserviceInstance) === -1
      );
  }

  /**
   * @param {String|Microservice} microservice
   * @returns {Boolean}
   */
  isWorkingMicroservice(microservice) {
    if (typeof microservice === 'string') {
      microservice = this.microservice(microservice);
    }

    return this.workingMicroservices.indexOf(microservice) !== -1;
  }

  /**
   * @returns {Microservice[]}
   */
  get workingMicroservices() {
    if (this._microservicesToUpdate.length <= 0) {
      return this.microservices;
    }

    return this.microservices
      .filter(
        (microserviceInstance) => this._microservicesToUpdate.indexOf(microserviceInstance) !== -1
      );
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

        if (FileSystem.statSync(fullPath).isDirectory() &&
          FileSystem.existsSync(Path.join(fullPath, Microservice.CONFIG_FILE))) {

          this._microservices.push(Microservice.create(fullPath));
        }
      }
    }

    return this._microservices;
  }
}
