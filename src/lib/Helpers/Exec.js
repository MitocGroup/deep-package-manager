/**
 * Created by AlexanderC on 12/1/15.
 */

'use strict';

import ChildProcess from 'child_process';
import {spawn} from 'spawn-cmd';
import syncExec from 'sync-exec';
import {EventEmitter} from 'events';
import os from 'os';

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

    console.log(' runSync,  _fullCmd: ', this._fullCmd);
    console.log(' runSync,  _cwd: ', this._cwd);

    let result = syncExec(this._fullCmd, {
      cwd: this._cwd,
    });

    console.log(' result: ', result);

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
    console.log('Exec run pipeOutput: ', pipeOutput);
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
    let cmdParts = this._cmd.trim().split(' ');
    let realCmd = cmdParts.shift();
    let realArgs = cmdParts.concat(this._args);
    let uncaughtError = false;

    console.log('before win parse cmdParts: ', typeof cmdParts);
    console.log('before win parse realCmd: ', typeof realCmd);
    console.log('before win parse realArgs: ', typeof realArgs);

    console.log('this._cwd: ', this._cwd);
    console.log('cmdParts: ', cmdParts);
    console.log('realCmd: ', realCmd);
    console.log('realArgs: ', realArgs);
    console.log('os.platform: ', os.platform());

    if(os.platform().indexOf('win32') > -1 || os.platform().indexOf('win64') > -1) {
      console.log("ON WIN");
      realCmd = this.winCmd;
      realArgs = this.winRealArgs;
      //this.cwd = this.winCwd;
    }

    console.log('after win parse cmdParts: ', typeof cmdParts);
    console.log('after win parse realCmd: ', typeof realCmd);
    console.log('after win parse realArgs: ', typeof realArgs);
    console.log('this._cwd: ', this.cwd);
    console.log('cmdParts: ', cmdParts);
    console.log('realCmd: ', realCmd);
    console.log('realArgs: ', realArgs);

    let proc = spawn(realCmd, realArgs, {
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
    console.log('CMD after changing: ', this._fullCmd.split('> /dev/null 2>&1').join(''));
    ChildProcess.exec(this._fullCmd.split('> /dev/null 2>&1').join(''), {
      cwd: this._cwd,
    }, (error, stdout) => {
      if (error) {
        this._error = new Error(
          `Command '${this._fullCmd}' failed in '${this._cwd}' with error: ${error}`
        );
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
    return ' > /dev/null 2>&1';
  }

/**
 * Returns command for Windows
 * @returns {String}
 */
  get winCmd() {
    let unixPath = null;

    if (this._cmd.indexOf('Program Files (x86)') > -1) {

      //command contains 2 space
      unixPath = this._cmd.trim().split(' ').slice(0, 3).join(' ');
    } else if (this._cmd.indexOf('Program Files') > -1) {

      //command contains 1 space
      unixPath = this._cmd.trim().split(' ').slice(0, 2).join(' ');
    } else {

      // doesn't contains spaces
      unixPath = this._cmd.trim().split(' ').slice(0, 1).join(' ');
    }

    let windowsPath = unixPath.replace(/^\/[a-z]+/, (diskName) => { return diskName.toUpperCase()+':';});

    return windowsPath.replace('\/', '').split('\/').join('\\');
  }

/**
 * Returns arguments for Windows
 * @returns {String}
 */
  get winRealArgs() {
    if (this._cmd.indexOf('Program Files (x86)') > -1) {

      //command contains 2 space
      return this._cmd.trim().split(' ').slice(3);
    } else if (this._cmd.indexOf('Program Files') > -1) {

      //command contains 1 space
      return this._cmd.trim().split(' ').slice(2);
    } else {

      // doesn't contains spaces
      return this._cmd.trim().split(' ').splice(1);
      //result = (result === '')? null: result;
    }
}

///**
// * Returns cwd compatible for Windows
// * @returns {String}
// */
//  get winCwd() {
//    let result = this._cwd.trim().split('\\').join('/')
//    return result.replace('C:', 'c');
//  }
}
