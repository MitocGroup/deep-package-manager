if [ -d 'lib/' ]; then
   BABEL_ENV=production babel lib/ --out-dir lib.compiled/;
else 
   echo "Folder 'lib' doesn't exist"; 
fi
