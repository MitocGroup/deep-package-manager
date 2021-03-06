#!/usr/bin/env bash
#
# Created by vcernomschi on 24/05/2016
#

RUN_TESTS() {
  echo '{
    "presets": [
      "es2015"
    ]
  }' > .babelrc

  babel-node $(npm root -g)/istanbul/lib/cli.js cover `which _mocha` -- 'test/**/*.spec.js' \
    --reporter spec --ui tdd --recursive --timeout 20s

  RESULT_CODE=$?

  rm .babelrc

  exit $RESULT_CODE
}

if [ -d 'lib/' ] && [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then

 #########################################################################
 ### Run with babel-node to support ES6 tests and have coverage in ES6 ###
 #########################################################################
 RUN_TESTS
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then

 #################################################
 ### Skip running on Windows from command line ###
 #################################################
 echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
elif [ -d 'lib/' ]; then

 #########################################
 ### Running from git-bash on Windows  ###
 #########################################
 echo "Running from git-bash with gathering coverage"
 RUN_TESTS
else

 ##################################################
 ### Skip running if `lib` folder doesn't exist ###
 ##################################################
 echo "Skipping testing..."
fi
