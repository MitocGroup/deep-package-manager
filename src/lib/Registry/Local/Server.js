/**
 * Created by AlexanderC on 2/12/16.
 */

'use strict';

import http from 'http';
import {RegistryAutoDiscovery} from '../Storage/Driver/Helpers/Api/RegistryAutoDiscovery';
import {FSDriver} from '../Storage/Driver/FSDriver';

export class Server {
  /**
   * @param {String} repositoryPath
   * @param {String|null} host
   * @param {Number} port
   */
  constructor(repositoryPath, host = null, port = Server.DEFAULT_HOST) {
    this._repositoryPath = repositoryPath;

    this._storage = new FSDriver(this._repositoryPath);

    this._port = port;
    this._host = host;
    this._server = null;
  }

  /**
   * @param {Function} cb
   * @returns {Server}
   */
  connect(cb) {
    if (this._server) {
      return this.stop(() => {
        this.connect(cb);
      });
    }

    let server = http.createServer(this._handle);

    let args = [this._port];

    if (this._host) {
      args.push(this._host);
    }

    args.push((error) => {
      if (error) {
        cb(error);
        return;
      }

      this._server = server;

      cb(null);
    });

    server.listen(...args);

    process.on('exit', () => {
      this.stop();
    });

    return this;
  }

  /**
   * @param {Function|Null} cb
   * @returns {Server}
   */
  stop(cb = null) {
    if (this._server) {
      this._server.close(cb);
      this._server = null;

      return this;
    }

    cb();

    return this;
  }

  /**
   * @param {Http.Request|Request|*} request
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @private
   */
  _handleRequest(request, response) {
    let urlParts = request.url;
    let uri = urlParts.pathname;

    if (Server._matchAutoDiscoveryRequest(uri)) {
      Server._sendRaw(response, {
        hasObj: `${this.baseUrl}/hasObj`,
        readObj: `${this.baseUrl}/readObj`,
        putObj: `${this.baseUrl}/putObj`,
        deleteObj: `${this.baseUrl}/deleteObj`,
      });

      return;
    }

    this._proxyStoreCall(uri.replace(/\//g, ''), request, response);
  }

  /**
   * @param {String} callType
   * @param {Http.Request|Request|*} request
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @private
   */
  _proxyStoreCall(callType, request, response) {
    let proxyMethod = this._storage[callType];

    if (typeof proxyMethod !== 'function') {
      Server._send(response, 'Missing registry storage method');
      return;
    }

    this._getRequestData(request, (dataObj) => {
      if (!dataObj) {
        Server._send(response, 'Missing or broken request payload (JSON object expected)');
        return;
      }

      let args = [dataObj.objPath,];

      if (args.hasOwnProperty('data')) {
        args.push(dataObj.data);
      }

      args.push((error, result) => {
        Server._send(response, error, result);
      });

      proxyMethod(...args);
    });
  }

  /**
   * @param {Http.Request|Request|*} request
   * @param {Function} cb
   * @private
   */
  _getRequestData(request, cb) {
    if (request.method === 'POST') {
      let rawData = '';

      request.on('data', function(chunk) {
        rawData += chunk.toString();
      });

      request.on('end', function() {
        try {
          cb(JSON.parse(rawData));
        } catch (error) {
          cb(null);
        }
      });
    } else {
      cb(null);
    }
  }

  /**
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @param {String|Error|null|*} error
   * @param {Object|null} data
   * @private
   */
  static _send(response, error, data = null) {
    Server._sendRaw(response, {
      error,
      data,
    });
  }

  /**
   * @param {Http.ServerResponse|ServerResponse|*} response
   * @param {Object} data
   * @private
   */
  static _sendRaw(response, data) {
    response.writeHead(200, {'Content-Type': 'application/json',});
    response.write(JSON.stringify(data));
    response.end();
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
  static get DEFAULT_HOST() {
    return 8002;
  }
}
