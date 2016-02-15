/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import http from 'http';
import {RegistryAutoDiscovery} from '../Storage/Driver/Helpers/Api/RegistryAutoDiscovery';
import {FSDriver} from '../Storage/Driver/FSDriver';
import Url from 'url';
import Core from 'deep-core';

export class Server {
  /**
   * @param {String} repositoryPath
   * @param {String|null} host
   * @param {Number} port
   */
  constructor(repositoryPath, host = null, port = Server.DEFAULT_PORT) {
    this._repositoryPath = repositoryPath;

    this._storage = new FSDriver(this._repositoryPath);

    this._authorizer = null;

    this._port = port;
    this._host = host;
    this._server = null;
    this._logger = global.console;
  }

  /**
   * @returns {Authorizer|null}
   */
  get authorizer() {
    return this._authorizer;
  }

  /**
   * @param {Authorizer|null} authorizer
   */
  set authorizer(authorizer) {
    this._authorizer = authorizer;
  }

  /**
   * @param {Function} cb
   * @param {Number} timeout
   * @returns {Server}
   */
  start(cb, timeout = Server.DEFAULT_TIMEOUT) {
    if (this.isListening) {
      return this.stop(() => {
        this.start(cb);
      });
    }

    let cbCalled = false;
    let cbWrapped = (error) => {
      if (cbCalled) {
        return;
      }

      cbCalled = true;

      if (error) {
        this.logger.error(`Error starting registry server: ${error}`);
      } else {
        this.logger.log(`Registry server has successfully started`);
      }

      cb(error);
    };

    let server = http.createServer(this._handleRequest.bind(this));

    let args = [this._port];

    if (this._host) {
      args.push(this._host);
    }

    args.push((error) => {
      if (error) {
        cbWrapped(error);
        return;
      }

      this._server = server;

      cbWrapped(null);
    });

    this.logger.log(`Starting registry server on '${this._host || '127.0.0.1'}:${this._port}'`);

    this._listen(server, args, cbWrapped, timeout);

    process.on('exit', () => {
      this.logger.log('Ensure registry server closed...');

      this.stop();
    });

    return this;
  }

  /**
   * @param {http.Server|Server|*} server
   * @param {*} args
   * @param {Function} cb
   * @param {Number} timeout
   * @private
   */
  _listen(server, args, cb, timeout) {
    server.listen(...args);

    setTimeout(() => {
      if (!this.isListening) {
        this._server.close(() => {
          cb(new Error(`Server startup timeout exceeded ${timeout} seconds`));
        });
      }
    }, timeout * 1000);
  }

  /**
   * @param {Function} cb
   * @returns {Server}
   */
  stop(cb = () => {}) {
    if (this.isListening) {
      this.logger.log('Closing registry server');

      this._server.close(cb);
      this._server = null;

      return this;
    }

    cb();

    return this;
  }

  /**
   * @returns {Boolean}
   */
  get isListening() {
    return !!this._server;
  }

  /**
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @private
   */
  _handleRequest(request, response) {
    this.logger.log(`---> [${request.method}] ${this.baseUrl}${request.url}`);

    new Core.Runtime.Sandbox(() => {
      let urlParts = Url.parse(request.url);
      let uri = urlParts.pathname;

      if (Server._matchAutoDiscoveryRequest(uri)) {
        this.logger.log(`<--- [SUCCEED] Sending auto discovery config`);

        Server._sendRaw(response, {
          hasObj: `${this.baseUrl}/hasObj`,
          readObj: `${this.baseUrl}/readObj`,
          putObj: `${this.baseUrl}/putObj`,
          deleteObj: `${this.baseUrl}/deleteObj`,
        });

        return;
      }

      this._authorize(request, (authError) => {
        if (authError) {
          Server._send(this.logger, response, authError.message);
          return;
        }

        this._proxyStoreCall(uri.replace(/\//g, ''), request, response);
      });
    })
      .fail((error) => {
        Server._send(this.logger, response, error.message);

        // @todo: remove it?
        this.logger.error(error.message, "\n", error.stack);
      }).run();
  }

  /**
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Function} cb
   * @private
   */
  _authorize(request, cb) {
    if (!this._authorizer) {
      cb(null);
      return;
    }

    let authHeaders = Object.keys(request.headers);

    // @todo: abstract this somehow?
    this.logger.log(`---> [AUTHORIZE] Looking for token in headers: ${authHeaders.join(', ')}`);

    this._authorizer.authorize(request, cb);
  }

  /**
   * @param {String} callType
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @private
   */
  _proxyStoreCall(callType, request, response) {
    let proxyMethod = this._storage[callType];

    if (typeof proxyMethod !== 'function') {
      Server._send(this.logger, response, 'Missing registry storage method');
      return;
    }

    this._getRequestData(request, (dataObj) => {
      if (!dataObj) {
        Server._send(this.logger, response, 'Missing or broken request payload (JSON object expected)');
        return;
      }

      let args = [dataObj.objPath,];

      if (args.hasOwnProperty('data')) {
        args.push(dataObj.data);
      }

      args.push((error, result) => {
        Server._send(this.logger, response, error, result);
      });

      proxyMethod.apply(this._storage, args);
    });
  }

  /**
   * @param {Http.IncomingMessage|IncomingMessage|*} request
   * @param {Function} cb
   * @private
   */
  _getRequestData(request, cb) {
    if (request.method === 'POST') {
      let rawData = '';

      request.on('data', (chunk) => {
        rawData += chunk.toString();
      });

      request.on('end', () => {
        let parsedData = null;

        try {
          parsedData = JSON.parse(rawData);
        } catch (error) {
        }

        cb(parsedData);
      });
    } else {
      cb(null);
    }
  }

  /**
   * @param {Console|*} logger
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @param {String|Error|null|*} error
   * @param {Object|null} data
   * @private
   */
  static _send(logger, response, error, data = null) {
    if (error) {
      logger.error(`<--- [ERROR] ${error}`);
    }

    let bytesSent = Server._sendRaw(response, {
      error,
      data,
    });

    if (!error) {
      logger.log(`<--- [SUCCEED] ${bytesSent} bytes sent`);
    }
  }

  /**
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @param {Object} data
   * @returns {Number}
   * @private
   */
  static _sendRaw(response, data) {
    let body = JSON.stringify(data);

    response.writeHead(200, {'Content-Type': 'application/json',});
    response.write(body);
    response.end();

    return body.length;
  }

  /**
   * @param {String} uri
   * @returns {Boolean}
   * @private
   */
  static _matchAutoDiscoveryRequest(uri) {
    let filePath = `/${RegistryAutoDiscovery.AUTO_DISCOVERY_FILE}`;

    return uri.toLowerCase() === filePath;
  }

  /**
   * @returns {Console}
   */
  get logger() {
    return this._logger;
  }

  /**
   * @param {Console} logger
   */
  set logger(logger) {
    this._logger = logger;
  }

  /**
   * @returns {String}
   */
  get baseUrl() {
    return `http://${this._host || '127.0.0.1'}:${this._port}`;
  }

  /**
   * @returns {AbstractDriver|FSDriver|ApiDriver|S3Driver|TmpFSDriver|*}
   */
  get storage() {
    return this._storage;
  }

  /**
   * @returns {String}
   */
  get host() {
    return this._host;
  }

  /**
   * @returns {Number}
   */
  get port() {
    return this._port;
  }

  /**
   * @returns {String}
   */
  get repositoryPath() {
    return this._repositoryPath;
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_TIMEOUT() {
    return 20;
  }

  /**
   * @returns {Number}
   */
  static get DEFAULT_PORT() {
    return 8002;
  }

  /**
   * @returns {String}
   */
  static get DEFAULT_REGISTRY_HOST() {
    return `http://127.0.0.1:${Server.DEFAULT_PORT}`;
  }
}
