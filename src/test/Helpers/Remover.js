/**
 * Created by vcernomschi on 1/6/16.
 */
'use strict';

import FileSystem from 'fs';
import path from 'path';

export class Remover {
  static rmdir(dir) {
    var list = FileSystem.readdirSync(dir);
    for (var i = 0; i < list.length; i++) {
      var filename = path.join(dir, list[i]);
      var stat = FileSystem.statSync(filename);

      if (filename === '.' || filename === '..') {
        // pass these files
      } else if (stat.isDirectory()) {
        // rmdir recursively
        Remover.rmdir(filename);
      } else {
        // rm fiilename
        FileSystem.unlinkSync(filename);
      }
    }

    FileSystem.rmdirSync(dir);
  };
}