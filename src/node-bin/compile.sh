if [ "$TRAVIS" == "true" ]; then
    echo "TravisCI environment detected. Skipping code transpiling to ES5..."
elif [ -d 'lib/' ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    NPM_GLOBAL_NM=`npm root -g`;

    BABEL_ENV=production babel lib/ --out-dir lib.compiled/ --presets ${NPM_GLOBAL_NM}/babel-preset-node6 --plugins ${NPM_GLOBAL_NM}/babel-plugin-add-module-exports
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
   echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
   echo "Skipping code transpiling to ES5..."
fi
