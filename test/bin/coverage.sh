#!/usr/bin/env bash

source $(dirname $0)/_head.sh

### Update paths ###

SEARCH_VALUE="/compile"
REPLACE_VALUE=""

sed -e "s@${SEARCH_VALUE}@${REPLACE_VALUE}@g" ${__SRC_PATH}"/coverage/lcov.info" > ${__SRC_PATH}"/coverage/coverage.info"

### Upload Coverage info to Codacy ###

cat ${__SRC_PATH}"/coverage/coverage.info" | codacy-coverage --debug

### Log top 20 file paths to be able see paths format from travis###
head -n 20 ${__SRC_PATH}"/coverage/coverage.info"

### Cleanup! ###

__CMD='rm -rf ./coverage'

subpath_run_cmd ${__SRC_PATH} "$__CMD"
