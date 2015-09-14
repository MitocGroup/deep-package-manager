#!/usr/bin/env bash

path=$(cd $(dirname $0); pwd -P)
npm=$(which npm)

publish_npm_package() {
    name=$(basename $1)

    echo "Publishing "${name}

    if [ -z $2 ] || ! $2; then
        cd $1 && rm -rf node_modules/ && npm install && ${npm} version $3 && ${npm} publish
    else
        cd $1 && ${npm} version $3
    fi
}

assure_npm() {
    if [ -z ${npm} ]; then
        assure_brew

        echo "Installing nodejs..."
        ${brew} install nodejs

        npm=$(which npm)
    fi
}
