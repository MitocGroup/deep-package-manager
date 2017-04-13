#!/usr/bin/env node

'use strict';

const path = require('path');
const FileWalker = require('../lib.compiled/Helpers/FileWalker').FileWalker;

const modules = {};
const libsDir = path.resolve(__dirname, '..', 'lib.compiled');
const walker = new FileWalker(FileWalker.RECURSIVE);

walker.walk(
  libsDir, 
  FileWalker.skipDotsFilter(file => {
    return /^(.*[\/|\\])?[A-Z][^\/\\]+\.js$/.test(file);
  })
)
.map(file => file.substr(libsDir.length + 1))
.map(classFile => {
  const matches = classFile.match(/^(?:.*[\/|\\])?([A-Z][^\/\\]+)\.js$/);
  const className = matches[1];
  const nsParts = classFile.split(path.sep).filter(part => !!part);
  
  nsParts.pop();

  const jsFile = path.resolve(libsDir, classFile);
  const jsObj = require(jsFile);

  if (jsObj.hasOwnProperty(className)) {
    const requireContent = jsFile.substr(libsDir.length + 1);

    nsParts.push(className);
    
    modules[nsParts.join('_')] = `require('./${requireContent}').${className}`;
  }
});

process.stdout.write(`'use strict';\n`);
process.stdout.write(`module.exports = {};\n`);

Object.keys(modules).map(moduleKey => {
  process.stdout.write(`module.exports.${moduleKey} = ${modules[moduleKey]};\n`);
});
