if [ -d 'lib/' ] && [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    npm list -g --depth 0 uglify > /dev/null 2>&1 || npm install uglify -g; for f in $(find lib.compiled -type f -name *.js); do uglify -s ${f} -o ${f}; done;
elif [ -d 'lib/' ] && [ "$OSTYPE" == "win32" ] && [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
elseif [ -d 'lib/' ] && [ "$OSTYPE" == "msys" ]
    echo "Running obfuscate-compiled from git-bash without results"
fi
