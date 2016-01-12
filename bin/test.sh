if [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" == "win32" ]; then
   babel-node `which isparta` cover --include 'lib/**/*.js' _mocha -- 'test/**/*.spec.js' --reporter spec --ui tdd --recursive
else
   echo "On windows"
    mocha --ui tdd --compilers js:mocha-babel --recursive --reporter spec
fi
