#!/usr/bin/env node

'use strict';

var os = require('os');
var fs = require('fs');
var path = require('path');
var extend = require('util')._extend;
var spawn = require('child_process').spawn;

var packageTemplate = {
  name: null,
  description: 'DEEP {name} library',
  version: '0.0.1',
  license: 'MIT',
  keywords: [
    'Digital Enterprise End-To-End Platform',
    'Amazon Web Services',
    'Platform-as-a-Service',
    'DEEP',
    'AWS',
    'PaaS',
    'Cloud',
    'Computing',
    'Microservices',
    'Architecture',
    'Serverless',
    'Abstracted',
    'DEEP Library',
    'Library'
  ],
};

var input = [].concat(process.argv);

input.shift();
input.shift();

if (input.length <= 0) {
  console.error("Usage: node ./npm_autopublisher.js search,registry,queue");
  process.exit(1);
}

var packageNames = input[0]
  .split(',')
  .map(function(s){return s.trim()})
  .filter(function(s){return s && s.length > 0});

packageNames.forEach(function(packageName) {
  var packagePath = path.join(os.tmpdir(), 'deep-library-' + packageName + '-' + (new Date()).getTime());

  try {
    fs.mkdirSync(packagePath);
    fs.writeFileSync(path.join(packagePath, 'package.json'), JSON.stringify(generatePackage(packageName)));
    fs.writeFileSync(path.join(packagePath, 'index.js'), 'module.exports = {};');
    fs.writeFileSync(
      path.join(packagePath, 'README.md'),
      "DEEP {name} library\n==========\n\nTBD".replace(/\{name\}/gi, packageName)
    );

    console.log('---> Publishing deep-' + packageName);

    var pub = spawn('npm', ['publish'], {cwd: packagePath,});

    pub.stdout.pipe(process.stdout);
    pub.stderr.pipe(process.stderr);

    pub.on('close', function(code) {
      if (code === 0) {
        console.log('---> deep-' + packageName + ' successfully published');
      } else {
        console.error('---> Failed publishing deep-' + packageName + ': Process exit with code ' + code);
      }
    });
  } catch (error) {
    console.error('---> Error while publishing deep-' + packageName + ': ' + error);
  }
});

function generatePackage(name) {
  var pkg = extend({}, packageTemplate);

  pkg.name = 'deep-' + name;
  pkg.description = pkg.description.replace(/\{name\}/gi, name);
  pkg.keywords.push(name);

  return pkg;
}

