if [ -d 'lib/' ]; then
   BABEL_ENV=production babel lib/ --out-dir lib.compiled/;
fi
