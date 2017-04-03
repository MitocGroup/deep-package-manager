/**
 * Created by AlexanderC on 5/27/15.
 */

/*eslint max-statements: [2, 62], no-unused-vars: 0*/

'use strict';

import AWS from 'aws-sdk';
import FileSystem from 'fs';
import Path from 'path';
import Core from 'deep-core';
import {Instance as Provisioning} from '../Provisioning/Instance';
import {Exception} from '../Exception/Exception';
import {InvalidArgumentException} from '../Exception/InvalidArgumentException';
import {Instance as Microservice} from '../Microservice/Instance';
import {PreDeployHook} from '../Microservice/PreDeployHook';
import {PostDeployHook} from '../Microservice/PostDeployHook';
import {InitHook} from '../Microservice/InitHook';
import {DuplicateRootException} from './Exception/DuplicateRootException';
import {MissingRootException} from './Exception/MissingRootException';
import {MissingMicroserviceException} from './Exception/MissingMicroserviceException';
import {Lambda} from './Lambda';
import {WaitFor} from '../Helpers/WaitFor';
import {Inflector} from '../Helpers/Inflector';
import {Frontend} from './Frontend';
import {Model} from './Model';
import {Migration} from './Migration';
import {ValidationSchema} from './ValidationSchema';
import {AbstractService} from '../Provisioning/Service/AbstractService';
import {S3Service} from '../Provisioning/Service/S3Service';
import {ESService} from '../Provisioning/Service/ESService';
import {Config} from './Config';
import {FrontendEngine} from '../Microservice/FrontendEngine';
import objectMerge from 'object-merge';
import {Listing} from '../Provisioning/Listing';
import {Undeploy} from '../Provisioning/Undeploy'; // Fixes weird issue on calling super()
import {PropertyMatcher} from '../Provisioning/UndeployMatcher/PropertyMatcher';
import {ProvisioningCollisionsListingException} from './Exception/ProvisioningCollisionsListingException';
import {ProvisioningCollisionsDetectedException} from './Exception/ProvisioningCollisionsDetectedException';
import {DeployID} from '../Helpers/DeployID';
import {MigrationsRegistry} from './MigrationsRegistry';
import {DeployConfig} from './DeployConfig';
import {InvalidConfigException} from './Exception/InvalidConfigException';
import {AbstractStrategy} from './ExtractStrategy/AbstractStrategy';
import {OptimisticStrategy} from './ExtractStrategy/OptimisticStrategy';
import {DeployIgnore} from './DeployIgnore';
import {PostRootFetchHook} from '../Microservice/PostRootFetchHook';
import {Parameters} from '../Microservice/Parameters';
import {PostInstallHook} from '../Microservice/PostInstallHook';

/**
 * Property instance
 */
export class Instance {
  /**
   * @param {String} path
   * @param {String|Object} config
   */
  constructor(path, config = Config.DEFAULT_FILENAME) {
    try {
      this._config = Instance._createConfigObject(config, path).extract();
    } catch (error) {

      // @todo: get rid of this?
      if (error instanceof InvalidConfigException) {
        console.error(error.message);
        console.info('The configuration structure may be have changed.' +
        ` Try to delete '${Config.DEFAULT_FILENAME}' and rerun the command in order to get it regenerated.`);
        process.exit(1);
      }

      throw error;
    }

    this._aws = AWS;

    // @todo: move it?
    AWS.config.update(this._config.aws);

    this._path = Path.normalize(path);
    this._microservices = null;
    this._localDeploy = false;
    this._provisioning = new Provisioning(this);
    this._deployIgnore = DeployIgnore.create(path);
    this._isUpdate = false;
    this._strategy = null;

    this._deployFlags = Instance.DEPLOY_BACKEND | Instance.DEPLOY_FRONTEND;
    this._microservicesToUpdate = [];

    this._config.deployId = new DeployID(this).toString();

    this._configObj = new DeployConfig(this);

    this._frontendConfig = null;
  }

  /**
   * @param {String} path
   * @returns {Instance}
   */
  static create(path) {
    let strategy = AbstractStrategy.create(path);
    let propInstance = new Instance(strategy.path(), strategy.config());

    propInstance.strategy = strategy;

    return propInstance;
  }

  /**
   * @returns {RegExp}
   */
  static get DEEP_RESOURCE_IDENTIFIER_REGEXP() {
    return /^@\s*([^:]+)\s*:\s*([^\s]+)\s*:\s*([^\s]+)\s*$/;
  }

  /**
   * @returns {DeployConfig}
   */
  get configObj() {
    return this._configObj;
  }

  /**
   * @returns {*}
   */
  get frontendConfig() {
    return this._frontendConfig;
  }

  /**
   * @param {AbstractStrategy} strategy
   */
  set strategy(strategy) {
    this._strategy = strategy;
  }

  /**
   * @param {Number} deployFlags
   */
  set deployFlags(deployFlags) {
    this._deployFlags = deployFlags;
  }

  /**
   * @returns {DeployIgnore}
   */
  get deployIgnore() {
    return this._deployIgnore;
  }

  /**
   * @returns {number}
   */
  get deployFrontend() {
    return this._deployFlags & Instance.DEPLOY_FRONTEND;
  }

  /**
   * @returns {number}
   */
  get deployBackend() {
    return this._deployFlags & Instance.DEPLOY_BACKEND;
  }

  /**
   * @param {Number} flag
   * @returns {Instance}
   */
  addDeployFlag(flag) {
    this._deployFlags |= flag;

    return this;
  }

  /**
   * @param {Number} flag
   * @returns {Instance}
   */
  removeDeployFlag(flag){ 
    this._deployFlags ^= flag;
    
    return this;
  }

  /**
   * @returns {AbstractStrategy}
   */
  get strategy() {
    if (this._strategy === null) {
      this._strategy = new OptimisticStrategy(this._path);
    }

    return this._strategy;
  }

  /**
   * @param {Function} callback
   * @param {Boolean} throwError
   * @returns {Instance}
   */
  verifyProvisioningCollisions(callback, throwError = true) {
    this.getProvisioningCollisions((error, resources) => {
      if (!error && resources) {
        error = new ProvisioningCollisionsDetectedException(resources, this._configObj.baseHash);
      }

      if (error && throwError) {
        throw error;
      }

      callback(error);
    }, new PropertyMatcher(this));

    return this;
  }

  /**
   * @param {Function} callback
   * @param {AbstractMatcher|*} matcher
   * @returns {Instance}
   */
  getProvisioningCollisions(callback, matcher = null) {
    let _this = this;
    let resourcesLister = new Listing(this);
    resourcesLister.hash = function (resourceName) {
      if (matcher) {
        return matcher.match(this.constructor.name.replace(/Driver$/i, ''), resourceName);
      }

      return AbstractService.extractBaseHashFromResourceName(resourceName) === _this._configObj.baseHash;
    };

    resourcesLister.list((result) => {
      if (Object.keys(result.errors).length > 0) {
        callback(new ProvisioningCollisionsListingException(result.errors), null);
      } else if (result.matchedResources <= 0) {
        callback(null, null);
      } else {
        let filteredResources = result.resources;

        if (matcher) {
          filteredResources = matcher.filter(result.resources);

          if (Object.keys(filteredResources).length <= 0) {
            callback(null, null);
            return;
          }
        }

        callback(null, filteredResources);
      }
    });

    return this;
  }

  /**
   * @returns {Microservice[]|String[]}
   */
  get microservicesToUpdate() {
    return this._microservicesToUpdate;
  }

  /**
   * @param {Microservice[]|String[]} microservices
   */
  set microservicesToUpdate(microservices) {
    this._microservicesToUpdate = microservices.map((ms) => {
      if (typeof ms === 'string') {
        let msObj = this.microservice(ms);

        if (!msObj) {
          throw new MissingMicroserviceException(ms);
        }

        return msObj;
      }

      return ms;
    });
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
  get env() {
    return this._config.env;
  }

  /**
   * @returns {String}
   */
  get apiVersion() {
    return this._config.apiVersion;
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
   * @returns {String}
   */
  get name() {
    return this._config.appName;
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
    let rootMicroservice = this._getRootMicroservice(microservices);

    if (!rootMicroservice) {
      throw new MissingRootException();
    }

    let modelsDirs = [];
    let validationSchemasDirs = [];

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

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
      validationSchemasDirs.push(microservice.autoload.validation);

      // merge all microservices global parameters
      if (microservice.parameters.globals) {
        this._config.globals = objectMerge(this._config.globals, microservice.parameters.globals);
      }
    }

    this._config.searchDomains = this._searchDomains;
    this._config.microservices = microservicesConfig;

    let models = Model.create(...modelsDirs);
    let validationSchemas = ValidationSchema.create(...validationSchemasDirs);

    this._config.models = models.map(m => m.extract());
    this._config.modelsSettings = models.map(m => m.settings.extract());
    this._config.nonPartitionedModels = this._getNonPartitionedModels(this.accountMicroservice);
    this._config.validationSchemas = validationSchemas.map((s) => {
      return {
        name: s.name,
        schemaPath: s.schemaPath,
      };
    });

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
            arn: lambdaInstance.arnGeneralized,
            name: lambdaInstance.functionName,
            region: lambdaInstance.region,
            localPath: Path.join(lambdaInstance.path, 'bootstrap.js'),
          };

        // inject symlinks
        lambdaInstance.injectValidationSchemas(this._config.validationSchemas, true);

        lambdaInstances.push(lambdaInstance);
      }
    }

    let lambdas = {};

    for (let i in lambdaInstances) {
      if (!lambdaInstances.hasOwnProperty(i)) {
        continue;
      }

      let lambdaInstance = lambdaInstances[i];

      // assure localRuntime flag set true!
      lambdas[lambdaInstance.arnGeneralized] = lambdaInstance.createConfig(this._config, true);

      lambdas[lambdaInstance.arnGeneralized].name = lambdaInstance.functionName;
      lambdas[lambdaInstance.arnGeneralized].path = Path.join(lambdaInstance.path, 'bootstrap.js');
    }

    return lambdas;
  }

  /**
   * @param {*} microservices
   * @returns {*}
   * @private
   */
  _getRootMicroservice(microservices) {
    let rootMicroservice = null;

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      if (microservice.isRoot) {
        if (rootMicroservice) {
          throw new DuplicateRootException(rootMicroservice, microservice);
        }

        rootMicroservice = microservice;
      }
    }

    return rootMicroservice;
  }

  /**
   * @param {Microservice} accountMicroservice
   * @returns {Array}
   * @private
   */
  _getNonPartitionedModels(accountMicroservice) {
    let nonPartitionedModels = [];

    if (accountMicroservice) {
      let backendParams = accountMicroservice.parameters[Parameters.BACKEND];

      nonPartitionedModels = (backendParams.nonPartitionedModels || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);
    }

    return nonPartitionedModels;
  }

  /**
   * @returns {Object}
   * @private
   */
  get _searchDomains() {
    let searchDomains = {};
    let globalCfg = this._config.globals || {};
    let typeES = {type: Core.AWS.Service.ELASTIC_SEARCH,};

    if (globalCfg.search && globalCfg.search.enabled) {
      searchDomains[ESService.CLIENT_DOMAIN_NAME] = typeES;
    }

    if (globalCfg.logDrivers && globalCfg.logDrivers.rum) {
      searchDomains[ESService.RUM_DOMAIN_NAME] = typeES;
    }

    return searchDomains;
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

    console.debug('Start building application');

    let microservicesConfig = isUpdate ? this._config.microservices : {};
    let microservices = this.microservices;
    let rootMicroservice = this._getRootMicroservice(microservices);

    if (!rootMicroservice) {
      throw new MissingRootException();
    }

    let modelsDirs = [];
    let validationSchemasDirs = [];

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

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
        let oldConfig = microservicesConfig[microservice.config.identifier] || {};
        microserviceConfig.deployedServices = oldConfig.deployedServices || {
          lambdas: {},
        };
      }

      microservicesConfig[microserviceConfig.identifier] = microserviceConfig;

      modelsDirs.push(microservice.autoload.models);
      validationSchemasDirs.push(microservice.autoload.validation);

      // merge all microservices global parameters
      if (microservice.parameters.globals) {
        this._config.globals = objectMerge(this._config.globals, microservice.parameters.globals);
      }
    }

    this._config.microservices = microservicesConfig;

    let models = Model.create(...modelsDirs);
    let validationSchemas = ValidationSchema.create(...validationSchemasDirs);

    this._config.models = models.map(m => m.extract());
    this._config.modelsSettings = models.map(m => m.settings.extract());
    this._config.nonPartitionedModels = this._getNonPartitionedModels(this.accountMicroservice);
    this._config.validationSchemas = validationSchemas.map((s) => {
      return {
        name: s.name,
        schemaPath: s.schemaPath,
      };
    });

    if (skipProvision) {
      callback();
    } else {
      console.debug(`Start ${isUpdate ? 'updating' : 'creating'} provisioning`);

      this.provisioning.create((config) => {
        this._config.provisioning = config;

        console.info('Application resources have been provisioned');

        callback();
      }, isUpdate);
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

    console.debug('Start deploying backend');

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

        let lambdaExecRole = lambdaExecRoles[microserviceIdentifier];
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

        lambdaInstance.injectValidationSchemas(this._config.validationSchemas);

        lambdas.push(lambdaInstance);
      }
    }

    let wait = new WaitFor();
    let concurrentCount = this.constructor.concurrentAsyncCount;
    let remaining = 0;

    // @todo: setup lambda defaults (memory size, timeout etc.)
    let asyncLambdaActions = (this.deployBackend ? lambdas : []).map((lambda) => {
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

    /**
     *
     */
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

    wait.push(() => {
      if (remaining === 0) {
        if (hasNextBatch) {
          processAsyncLambdaBatch();
          return false;
        } else {
          return true;
        }
      }

      return false;
    });

    wait.ready(() => {
      if (!this.deployFrontend) {
        return callback();
      }

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
          console.debug('Start deploying frontend');

          frontend.deploy(this._aws, publicBucket).ready(callback);
        }
      });
    });

    return this;
  }

  /**
   * @param {String} dumpPath
   * @param {Function} callback
   * @returns {Frontend}
   */
  buildFrontend(dumpPath = null, callback = () => {}) {
    let frontend = new Frontend(this, this._config.microservices, dumpPath || this._path, this.deployId);

    this._frontendConfig = Frontend.createConfig(this._config);

    frontend.build(this._frontendConfig, callback.bind(this, frontend));

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

    this.provisioning.postDeployProvision((config) => {
      this._config.provisioning = config;
      this._runPostDeployMsHooks(() => {
        this._runMigrations(callback);
      });
    }, this._isUpdate);

    return this;
  }

  /**
   * @param {Function} callback
   * @private
   */
  _runMigrations(callback) {
    let microservices = this.microservices;
    let migrationDirs = [];

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      migrationDirs.push(microservice.autoload.migration);
    }

    let migrations = Migration.create(...migrationDirs);

    if (migrations.length <= 0) {
      console.debug('No migrations to be loaded. Skipping...');

      callback();
      return;
    }

    let registry = MigrationsRegistry.create(this);

    console.debug('Loading migrations registry');

    registry.load((error) => {
      if (error) {
        console.error(error);
        callback();
        return;
      }

      let wait = new WaitFor();
      let remaining = migrations.length;

      migrations.forEach((migration) => {
        migration.registry = registry;

        migration.up(this, (error) => {
          if (error) {
            console.error(error);
          }

          remaining--;
        });
      });

      wait.push(() => {
        return remaining <= 0;
      });

      wait.ready(() => {
        console.debug('Persisting migrations registry');

        registry.dump((error) => {
          if (error) {
            console.error(error);
          }

          callback();
        });
      });
    });
  }

  /**
   * @param {Function} callback
   * @private
   */
  _runPostDeployMsHooks(callback) {
    this._runHook(PostDeployHook, callback);
  }

  /**
   * @param {String} callback
   * @private
   */
  _runPostRootFetchHooks(callback) {
    this._runHook(PostRootFetchHook, callback);
  }

  /**
   * @param {Function} callback
   */
  runInitMsHooks(callback) {
    this._runHook(InitHook, callback);
  }

  /**
   * @param {Function} callback
   */
  runPreDeployMsHooks(callback) {
    this._runHook(PreDeployHook, callback);
  }

  /**
   * @param {Function} callback
   */
  runPostInstallMsHooks(callback) {
    this._runHook(PostInstallHook, callback);
  }

  /**
   * @param {Object} hookClass
   * @param {Function} callback
   * @returns {Instance}
   * @private
   */
  _runHook(hookClass, callback) {
    let wait = new WaitFor();
    let microservices = this.microservices;
    let remaining = microservices.length;
    let msHookProperty = Inflector.lowerCaseFirst(hookClass.NAME);

    wait.push(() => {
      return remaining <= 0;
    });

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];
      let hook = microservice[msHookProperty];

      if (!hook) {
        console.debug(`No ${hookClass.NAME} found for microservice ${microservice.identifier}`);
        remaining--;
        continue;
      }

      console.debug(`Running ${hookClass.NAME} for microservice ${microservice.identifier}`);

      hook(...hookClass.getBindingParameters(this).concat(() => {
        remaining--;
      }));
    }

    wait.ready(() => {
      callback();
    });

    return this;
  }

  /**
   * @param {Function} callback
   * @param {Object|null} propertyConfigSnapshot
   * @param {Microservice[]} microservicesToUpdate
   * @returns {Instance}
   */
  update(callback, propertyConfigSnapshot = null, microservicesToUpdate = []) {
    this._isUpdate = true;
    this._provisioning.isUpdate();
    this.microservicesToUpdate = microservicesToUpdate;

    if (propertyConfigSnapshot) {
      this._configObj.updateConfig(propertyConfigSnapshot);
    } else {
      this._configObj.tryReadFromDump();
    }

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

    if (!this._isUpdate) {
      console.debug(
        `Checking possible provisioning collisions for application #${this.identifier}/${this._config.env}`
      );

      this.verifyProvisioningCollisions(() => {
        console.debug(`Start installing application #${this.identifier}/${this._config.env}`);

        this.build(() => {
          this.deploy(() => {
            this.postDeploy(callback);
          });
        }, skipProvision);
      });

      return this;
    }

    console.debug(`Start updating application #${this.identifier}/${this._config.env}`);

    return this.build(() => {
      this.deploy(() => {
        this.postDeploy(callback);
      });
    }, skipProvision);
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  assureFrontendEngine(callback) {
    let microservices = this.microservices;

    for (let i in microservices) {
      if (!microservices.hasOwnProperty(i)) {
        continue;
      }

      let microservice = microservices[i];

      if (microservice.isRoot) {
        callback(null);
        return this;
      }
    }

    return this.fetchFrontendEngine(callback);
  }

  /**
   * @param {Function} callback
   * @returns {Instance}
   */
  fetchFrontendEngine(callback) {
    let frontendEngineManager = new FrontendEngine();
    let microservices = this.microservices;

    let suitableEngine = frontendEngineManager.findSuitable(...microservices);

    if (!suitableEngine) {
      callback(new Error(`No suitable engine found (looking for ${frontendEngineManager.rawEngines.join(', ')})`));
      return this;
    }

    FrontendEngine.fetch(this, suitableEngine, (error) => {
      if (!error) {

        // reset in order to get refreshed microservices
        this._microservices = null;
        this._runPostRootFetchHooks(callback);

        return;
      }

      callback(error);
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
   * @returns {Microservice}
   */
  get rootMicroservice() {
    for (let i in this._microservices) {
      if (!this._microservices.hasOwnProperty(i)) {
        continue;
      }

      if (this._microservices[i].isRoot) {
        return this._microservices[i];
      }
    }

    return null;
  }

  /**
   * @todo: add advanced criteria for account microservice
   * @returns {Microservice/Instance}
   */
  get accountMicroservice() {
    return this.microservice('deep-account');
  }

  /**
   * @returns {Microservice[]}
   */
  get microservices() {
    if (this._microservices === null) {
      this._microservices = [];

      let files = FileSystem.readdirSync(this._path);

      for (let i in files) {
        if (!files.hasOwnProperty(i)) {
          continue;
        }

        let file = files[i];

        let fullPath = Path.join(this._path, file);

        if (FileSystem.statSync(fullPath).isDirectory() &&
          FileSystem.existsSync(Path.join(fullPath, Microservice.CONFIG_FILE))) {

          let microservice = Microservice.create(fullPath);
          microservice.property = this;

          if (this.strategy.shouldPreserve(microservice)) {
            this._microservices.push(microservice); 
          }
        }
      }
    }

    return this._microservices;
  }

  /**
   * @param {String} resourceIdentifier (e.g. @msId:resourceName:actionName)
   * @returns {String}
   * @private
   */
  getLambdaArnForDeepResourceId(resourceIdentifier) {
    let regExp = Instance.DEEP_RESOURCE_IDENTIFIER_REGEXP;

    if (typeof resourceIdentifier === 'string' && regExp.test(resourceIdentifier)) {
      let parts = resourceIdentifier.match(regExp);
      let msId = parts[1];
      let resourceName = parts[2];
      let actionName = parts[3];

      let msConfig = this.config.microservices;

      if (!msConfig.hasOwnProperty(msId)) {
        return null;
      }

      let ms = msConfig[msId];

      if (!ms.resources.hasOwnProperty(resourceName)) {
        return null;
      }

      let resourceActions = ms.resources[resourceName];

      if (!resourceActions.hasOwnProperty(actionName)) {
        return null;
      }

      let action = resourceActions[actionName];

      if (ms.lambdas && ms.lambdas.hasOwnProperty(action.identifier)) {
        return ms.lambdas[action.identifier].arn || null;
      }

      return null;
    } else {
      throw new Error(`Invalid deep resource identifier "${resourceIdentifier}".`);
    }
  }

  /**
   * @param {String} actionIdentifier
   * @param {Function} callback
   */
  deployAction(actionIdentifier, callback) {
    let lambdaArn = this.getLambdaArnForDeepResourceId(actionIdentifier);
    let lambdaName = lambdaArn.replace(/.+\/([^\/]+)/, '$1');

    let actionParts = actionIdentifier.match(Instance.DEEP_RESOURCE_IDENTIFIER_REGEXP);
    let microserviceIdentifier = actionParts[1];
    let resourceName = actionParts[2];
    let actionName = actionParts[3];
    let lambdaIdentifier = `${resourceName}-${actionName}`;

    let lambdaExecRoles = this._config.provisioning.lambda.executionRoles;
    let lambdaExecRole = lambdaExecRoles[microserviceIdentifier];

    let microservice = this._config.microservices[microserviceIdentifier];
    let lambdaPath = microservice.raw.lambdas[lambdaIdentifier];
    let lambdaOptions = microservice.raw.lambdas._[lambdaIdentifier];

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
    lambdaInstance.injectValidationSchemas(this._config.validationSchemas);

    lambdaInstance.update(callback);
  }

  /**
   * @returns {number}
   */
  static get DEPLOY_FRONTEND() {
    return 0x001;
  }

  /**
   * @returns {number}
   */
  static get DEPLOY_BACKEND() {
    return 0x002;
  }
}
