#!/usr/bin/env bash

# todo: find a smarter fix
# Fixing "spawn sh ENOENT" issue
cd /

REQUIRED_DEPS=("babel-cli" "babel-preset-node6" "babel-plugin-add-module-exports");
NPM_BIN=`which npm`
NPM_GLOBAL_NM=`$NPM_BIN root -g`

echo "Checking babel-* dependencies in $NPM_GLOBAL_NM"

for DEP in ${REQUIRED_DEPS[@]}; do
  if [ ! -d "$NPM_GLOBAL_NM/$DEP" ]; then
    echo "Installing missing $DEP"
    "$NPM_BIN" install -g "$DEP" || (echo "Failed to install $DEP" && exit 1)
    echo "$DEP has been installed"
    echo ""
  fi
done

exit 0
