/**
 * Created by AlexanderC on 5/22/15.
 *
 * Bootstrap file loaded by npm as main
 */

'use strict';

import {FileWalker} from './Helpers/FileWalker';
import path from 'path';

let walker = new FileWalker(FileWalker.RECURSIVE);

let classFiles = walker.walk(__dirname, FileWalker.skipDotsFilter((file) => {
  return /^(.*\/)?[A-Z][^\/]+\.js$/.test(file);
})).map((file) => file.substr(__dirname.length));

let exp = {};

classFiles.forEach((classFile) => {
  let matches = classFile.match(/^(?:.*\/)?([A-Z][^\/]+)\.js$/);
  let className = matches[1];

  let nsParts = classFile.split('/').filter((part) => !!part);
  nsParts.pop();

  let jsObj = require(path.join(__dirname, classFile));

  if (jsObj.hasOwnProperty(className)) {
    let classObj = jsObj[className];
    nsParts.push(className);

    exp[nsParts.join('_')] = classObj;
  }
});

export default exp;
