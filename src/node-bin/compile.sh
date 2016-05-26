#!/usr/bin/env bash
#
# Created by vcernomschi on 24/05/2016
#

if [ "$TRAVIS" == "true" ]; then

  ######################################################
  ### Skip transpile to ES5 when running from Travis ###
  ######################################################
  echo "TravisCI environment detected. Skipping code transpiling to ES5..."
elif [ -d 'lib/' ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then

  #################################################################
  ### Transpile to ES5 when running on local and not on Windows ###
  #################################################################
  NPM_GLOBAL_NM=`npm root -g`;

  BABEL_ENV=production babel lib/ --out-dir lib.compiled/ --presets ${NPM_GLOBAL_NM}/babel-preset-es2015 \
    --plugins ${NPM_GLOBAL_NM}/babel-plugin-add-module-exports;
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then

  #####################################################
  ### Skip transpiling on Windows from command line ###
  #####################################################
  echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else

  ######################################################
  ### Skip transpiling if `lib` folder doesn't exist ###
  ######################################################
  echo "Skipping code transpiling to ES5..."
fi
