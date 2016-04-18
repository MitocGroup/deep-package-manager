if [ "$TRAVIS" == "true" ]; then
    echo "TravisCI environment detected. Skipping code transpiling to ES5..."
elif [ -d 'lib/' ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
   BABEL_ENV=production babel lib/ --out-dir lib.compiled/ --presets es2015 --plugins add-module-exports;
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
   echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
   echo "Skipping code transpiling to ES5..."
fi
