if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" != "win32" ] && [ "$OSTYPE" != "win64" ]; then
    babel-node `which isparta` cover --include 'lib/**/*.js' _mocha -- 'test/**/*.spec.js' --reporter spec --ui tdd --recursive
elif [ "$OSTYPE" == "win32" ] || [ "$OSTYPE" == "win64" ]; then
    echo "You should have installed and configured http://git-scm.com/ and run all bash command by using git-bash.exe"
else
    echo "Running from git-bash without gathering coverage"
    babel-node _mocha --ui tdd --recursive --reporter spec
fi
