/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import ChildProcess from 'child_process';
import {spawn} from 'spawn-cmd';
import syncExec from 'sync-exec';
import {EventEmitter} from 'events';
import {Env} from './Env';
import fs from 'fs';

export class Exec {
  /**
   * @param {String} cmd
   * @param {String|*} args
   */
  constructor(cmd, ...args) {
    this._cmd = cmd;
    this._args = args;

    this._error = null;
    this._isExec = false;
    this._devNull = false;
    this._result = null;

    this._cwd = process.cwd();
  }

  /**
   * @returns {String}
   */
  get cwd() {
    return this._cwd;
  }

  /**
   * @param {String} path
   */
  set cwd(path) {
    this._cwd = path;
  }

  /**
   * @returns {String|null}
   */
  get result() {
    this._assureCmdExecuted();

    return this._result;
  }

  /**
   * @returns {Boolean}
   */
  get succeed() {
    return !this.error;
  }

  /**
   * @returns {Boolean}
   */
  get failed() {
    return !!this.error;
  }

  /**
   * @returns {String|Error|null}
   */
  get error() {
    this._assureCmdExecuted();

    return this._error;
  }

  /**
   * @returns {Exec}
   */
  avoidBufferOverflow() {
    this._devNull = true;

    return this;
  }

  /**
   * @returns {String}
   */
  get cmd() {
    if (Env.isWin) {
      return Exec.winCmd(this._cmd);
    }

    return this._cmd;
  }

  /**
   * @returns {Array}
   */
  get args() {
    return this._args;
  }

  /**
   * @param {String} arg
   * @returns {Exec}
   */
  addArg(arg) {
    this._args.push(arg);

    return this;
  }

  /**
   * @returns {Exec}
   */
  runSync() {
    this._isExec = true;

    let result = syncExec(this._fullCmd, {
      cwd: this._cwd,
    });

    this._checkError(result.status);
    this._result = result.stdout ? result.stdout.toString().trim() : null;

    return this;
  }

  /**
   * @param {Function} cb
   * @param {Boolean} pipeOutput
   * @returns {Exec}
   */
  run(cb, pipeOutput = false) {
    this._isExec = true;

    if (pipeOutput) {
      return this._spawn(cb);
    }

    return this._exec(cb);
  }

  /**
   * @param {Boolean} increase
   * @param {EventEmitter|*} emitters
   * @private
   */
  static _tweakProcessListeners(increase = true, ...emitters) {
    /**
     * @type {EventEmitter[]}
     */
    emitters = [
      process,
      process.stdout,
      process.stderr,
      process.stdin,
    ].concat(emitters);

    for (let i in emitters) {
      if (!emitters.hasOwnProperty(i)) {
        continue;
      }

      let emitter = emitters[i];

      if (!emitter.hasOwnProperty('getMaxListeners')) {
        emitter.__max_listeners__ = EventEmitter.defaultMaxListeners || 0;

        emitter.getMaxListeners = () => {
          return emitter.__max_listeners__;
        };
      }

      if (increase) {
        emitter.setMaxListeners(emitter.getMaxListeners() + 1);

        if (emitter.hasOwnProperty('__max_listeners__')) {
          emitter.__max_listeners__++;
        }
      } else {
        emitter.setMaxListeners(Math.max(emitter.getMaxListeners() - 1, 0));

        if (emitter.hasOwnProperty('__max_listeners__')) {
          emitter.__max_listeners__--;
        }
      }
    }
  }

  /**
   * @param {Function} cb
   * @returns {Exec}
   * @private
   */
  _spawn(cb) {
    let cmd = this.cmd;
    let realCmd = Exec.resolveCmd(cmd);
    let realArgs = (cmd === realCmd ) ? this._args: cmd.replace(realCmd, '').trim().split(' ').concat(this._args);
    let uncaughtError = false;

    let spawnCmd = Env.isWin ? spawn: ChildProcess.spawn;

    let proc = spawnCmd(realCmd, realArgs, {
      cwd: this._cwd,
      stdio: [process.stdin, 'pipe', 'pipe'],
    });

    Exec._tweakProcessListeners(true, proc);

    proc.stdout.pipe(process.stdout);
    proc.stderr.pipe(process.stderr);

    proc.stdout.on('data', (data) => {
      if (!this._result) {
        this._result = '';
      }

      this._result += data.toString();
    });

    proc.on('uncaughtException', (error) => {
      uncaughtError = true;

      Exec._tweakProcessListeners(false, proc);

      this._error = error;

      cb(this);
    });

    proc.on('close', (code) => {
      if (uncaughtError) {
        return;
      }

      Exec._tweakProcessListeners(false, proc);

      this._checkError(code);

      if (this._result) {
        this._result = this._result.trim();
      }

      cb(this);
    });

    return this;
  }

  /**
   * @param {Function} cb
   * @returns {Exec}
   * @private
   */
  _exec(cb) {
    ChildProcess.exec(this._fullCmd, {
      cwd: this._cwd,
    }, (error, stdout) => {
      if (error) {
        this._error = new Error(`Command '${this._fullCmd}' failed in '${this._cwd}' with error: ${error}`);
      } else {
        this._result = stdout ? stdout.toString().trim() : null;
      }

      cb(this);
    });

    return this;
  }

  /**
   * @param {String|Number} code
   * @private
   */
  _checkError(code) {
    if (parseInt(code) !== 0) {
      this._error = new Error(`Command '${this._fullCmd}' failed in '${this._cwd}' with exit code ${code}`);
    }
  }

  /**
   * @returns {String}
   * @private
   */
  get _fullCmd() {
    let suffix = this._internalCmdSuffix;
    let cmd = Exec._internalsTokenTransform(
      `${this._cmd} ${this._args.join(' ')}`
    );

    cmd = cmd.split(';').join(` ${suffix} ; `);
    cmd = cmd.split('&&').join(` ${suffix} && `);
    cmd = cmd.split('||').join(` ${suffix} || `);

    cmd += suffix;
    cmd = cmd.replace(new RegExp(`(${Exec.PIPE_VOID})+`), Exec.PIPE_VOID);

    return Exec._internalsTokenTransform(cmd, true).trim();
  }

  /**
   * @param {String} cmd
   * @param {Boolean} unescape
   * @returns {String}
   * @private
   */
  static _internalsTokenTransform(cmd, unescape = false) {
    let tokens = Exec.INTERNAL_ESCAPE_TOKENS;

    for (let tokenName in tokens) {
      if (!tokens.hasOwnProperty(tokenName)) {
        continue;
      }

      let token = Exec._internalsEscapeToken(tokenName);
      let tokenSeq = tokens[tokenName];

      if (unescape) {
        cmd = cmd.replace(new RegExp(token, 'g'), tokenSeq);
      } else {
        cmd = cmd.replace(new RegExp(tokenSeq, 'g'), token);
      }
    }

    return cmd;
  }

  /**
   * @returns {String}
   * @private
   */
  get _internalCmdSuffix() {
    return this._devNull ? Exec.PIPE_VOID : '';
  }

  /**
   * @private
   */
  _assureCmdExecuted() {
    if (!this._isExec) {
      throw new Error(`Command '${this._fullCmd}' is not yet executed (cwd: '${this._cwd}')`);
    }
  }

  /**
   * @param {String} name
   * @returns {String}
   * @private
   */
  static _internalsEscapeToken(name) {
    return `__deep__exec_intrnls_${name}__`;
  }

  /**
   * Tokens used to escape internals
   * in order to avoid broken commands
   *
   * @returns {Object}
   * @constructor
   */
  static get INTERNAL_ESCAPE_TOKENS() {
    return {
      semicolon: '\;', // find -exec ... \;
    };
  }

  /**
   * @returns {String}
   */
  static get PIPE_VOID() {

    if (Env.isWin) {
      return ' > NUL 2>&1 ';
    }

    return ' > /dev/null 2>&1';
  }

  /**
   * Returns command in Windows format
   * @param {String} cmd
   * @returns {String}
   */
  static winCmd(cmd) {

    let windowsFormat = cmd.replace(/(^|\s)(?:\/([a-z]{1}))(\/|\s*$)/gi, '$1 $2:$3');

    return windowsFormat.split('\/').join('\\');
  }

  /**
   * Returns path for command by checking if folder/file exists
   * @param {String} cmd
   * @returns {null|String}
   */
  static resolveIfPathExists(cmd) {
    let cmdParts = cmd.trim().split(' ');
    let toResolve = cmdParts[0];
    let isResolved = false;

    for (let i = 0; i < cmdParts.length - 1; i++) {
      if (fs.existsSync(toResolve)) {
        isResolved = true;
        break;
      } else {
        toResolve = cmd.substring(0, cmd.indexOf(cmdParts[i + 1])) + cmdParts[i + 1];
      }
    }

    return (isResolved) ? toResolve : cmdParts[0];
  }

  /**
   * Returns path for command by checking if exists in bin
   * @param {String} cmd
   * @returns {null|String}
   */
  static resolvePathInBinPath(cmd) {
    let binSeparator = (Env.isWin) ? ';' : ':';
    let binItems = process.env.PATH.trim().split(binSeparator);
    let realCmd = null;

    for (let binItem of binItems) {
      let index = cmd.indexOf(binItem);
      if (index === 0) {
        realCmd = binItem + cmd.replace(binItem, '').split(' ')[0];
        break;
      }
    }

    return realCmd;
  }

  /**
   * Returns path for command by checking with which
   * @param {String} cmd
   * @returns {null|String}
   */
  static resolvePathByWhich(cmd) {
    let toCheck = cmd.split(' ')[0];
    let status = syncExec('which ' + toCheck).status;

    if (status !== 0) {
      return null;
    }

    return toCheck;
  }

  static resolveCmd(cmd) {
    let result = Exec.resolvePathInBinPath(cmd);
    if (result) {
      return result;
    }

    result = Exec.resolvePathByWhich(cmd);
    if (result) {
      return result;
    }

    result = Exec.resolveIfPathExists(cmd);
    if (result) {
      return result;
    }
  }
}
