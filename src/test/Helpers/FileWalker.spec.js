'use strict';

import chai from 'chai';
import {FileWalker} from '../../lib/Helpers/FileWalker';
import FileSystem from 'fs';
import path from 'path';

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

  test('Check ignoreFile setter sets _ignoreFile = "ignoreFilePath"', function() {
    fileWalker.ignoreFile = ignoreFile;
    chai.expect(fileWalker.ignoreFile).to.be.equal(ignoreFile);
  });

  test('Check RECURSIVE static getter returns "recursive"', function() {
    chai.expect(FileWalker.RECURSIVE).to.be.equal('recursive');
  });

  test('Check SIMPLE getter returns "simple"', function() {
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

  test('Check _buildIgnoreFilter() return true with configured ignore file', function() {
    fileWalker.ignoreFile = '.gitignore';
    let dirPath = path.join(__dirname, '../testMaterials/Helpers');

    let actualResult = fileWalker._buildIgnoreFilter(dirPath);

    chai.expect(actualResult()).to.eql(true);
  });

  test('Check _buildIgnoreFilter() returns true', function() {
    let actualResult = fileWalker._buildIgnoreFilter('testMaterials');

    chai.expect(actualResult()).to.equal(true);
  });

  test('Check copy() copies content from source to destination folder', function() {
    let fileName = '.gitignore';
    let sourcePath = path.join(__dirname, '../testMaterials/Helpers/');
    let destinationPath = path.join(__dirname, '../testMaterials/Helpers/Destination/');
    let destinationFilePath = destinationPath + fileName;

    fileWalker.copy(sourcePath, destinationPath);

    let stats = FileSystem.statSync(destinationFilePath);
    chai.expect(stats.isFile()).to.be.equal(true);

    //remove destination directory with the copied content
    rmdir(destinationPath);
  });

  test('Check walk() method', function () {
    let dirPath = path.join(__dirname, '../testMaterials/assets');
    let expectedResult = [
      path.join(__dirname, '../testMaterials/assets/expectedResults/content.css.js'),
      path.join(__dirname, '../testMaterials/assets/expectedResults/content.html.js'),
      path.join(__dirname, '../testMaterials/assets/expectedResults/data.css'),
      path.join(__dirname, '../testMaterials/assets/expectedResults/data.html'),
      path.join(__dirname, '../testMaterials/assets/expectedResults/dataWithDeployId.css'),
      path.join(__dirname, '../testMaterials/assets/expectedResults/dataWithDeployId.html'),
      path.join(__dirname, '../testMaterials/assets/rawFiles/data.css'),
      path.join(__dirname, '../testMaterials/assets/rawFiles/data.html'),
    ];

    let actualResult = fileWalker.walk(dirPath);

    chai.expect(actualResult).to.be.eql(expectedResult);
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
