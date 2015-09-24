'use strict';

import chai from 'chai';
import {FileWalker} from '../../lib.compiled/Helpers/FileWalker';
import FileSystem from 'fs';

suite('Helpers/FileWalker', function() {
  let fileWalker = new FileWalker();
  let ignoreFile = 'ignoreFilePath';
  let directoryPath = 'testDirectory';
  let directoryWithSubPaths = 'testDirectories/subdir/dir';
  let error = null;

  test('Class FileWalker exists in Helpers/FileWalker', function() {
    chai.expect(typeof FileWalker).to.equal('function');
  });

  test('Check constructor sets valid default value for _type', function() {
    chai.expect(fileWalker.type).to.be.equal(FileWalker.SIMPLE);
  });

  test('Check constructor sets valid default value for _ignoreFile=null', function() {
    chai.expect(fileWalker.ignoreFile).to.be.equal(null);
  });

  test('Check ignoreFile setter sets _ignoreFile = \'ignoreFilePath\'', function() {
    fileWalker.ignoreFile = ignoreFile;
    chai.expect(fileWalker.ignoreFile).to.be.equal(ignoreFile);
  });

  test('Check RECURSIVE static getter returns \'recursive\'', function() {
    chai.expect(FileWalker.RECURSIVE).to.be.equal('recursive');
  });

  test('Check SIMPLE getter returns \'simple\'', function() {
    chai.expect(FileWalker.SIMPLE).to.be.equal('simple');
  });

  test('Check mkdir() method creates simple directory and returns undefined', function() {
    error = null;

    try {
      fileWalker.mkdir(directoryPath);
      chai.expect(FileSystem.existsSync(directoryPath)).to.be.equal(true);
      rmdir(directoryPath);
    } catch (e) {
      error = e;
      if (error.message === `EEXIST, file already exists \'${directoryPath}\'`) {
        rmdir(directoryPath);
      }
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(FileSystem.existsSync(directoryPath)).to.be.equal(false);
  });

  test('Check mkdir() method creates directory and any necessary subdirectories', function() {
    error = null;
    try {
      fileWalker._type = FileWalker.RECURSIVE;
      fileWalker.mkdir(directoryWithSubPaths);
      chai.expect(FileSystem.existsSync(directoryWithSubPaths)).to.be.equal(true);
      rmdir(directoryWithSubPaths);
    } catch (e) {
      error = e;
      if (error.message === `EEXIST, file already exists \'${directoryWithSubPaths}\'`) {
        rmdir(directoryWithSubPaths);
      }
    }

    chai.expect(error).to.be.equal(null);
    chai.expect(FileSystem.existsSync(directoryWithSubPaths)).to.be.equal(false);
  });

  var rmdir = function(dir) {
    var list = FileSystem.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = FileSystem.statSync(filename);

      if (filename === '.' || filename === '..') {
        // pass these files
      } else if (stat.isDirectory()) {
        // rmdir recursively
        rmdir(filename);
      } else {
        // rm fiilename
        FileSystem.unlinkSync(filename);
      }
    }

    FileSystem.rmdirSync(dir);
  };
});
