if [ -d 'lib/' ] && [ "$OSTYPE" != "msys" ] && [ "$OSTYPE" == "win32" ]; then  
   npm list -g --depth 0 uglify > /dev/null 2>&1 || npm install uglify -g; for f in $(find lib.compiled -type f -name *.js); do uglify -s ${f} -o ${f}; done;
else 
   echo "On windows or doesn't exist '/lib' folder"; 
fi
