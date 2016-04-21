#!/usr/bin/env bash

babel=$(which babel)

if [ -z ${babel} ]; then
    echo "Seems like babel is not installed! Installing babel v6 as default transpiler..."
    echo ""
    npm install babel-cli@6.x -g

    babel=$(which babel)
    babel_version=$(babel --version)

    echo "Installed babel ${babel_version}"
fi

BABEL_DEPS=("babel-preset-es2015" "babel-plugin-add-module-exports");

for DEP in ${BABEL_DEPS[@]}; do
    ! [ "$(npm ls -g --depth 0 | grep ${DEP}@)" ] && npm install -g ${DEP};
done;
