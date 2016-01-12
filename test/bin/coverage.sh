#!/usr/bin/env bash

source $(dirname $0)/_head.sh

### Upload Coverage info to Codacy ###

cat ${__SRC_PATH}"/coverage/lcov.info" | codacy-coverage --debug

### Log top 20 file paths to be able see paths format from travis###
head -n 20 ${__SRC_PATH}"/coverage/lcov.info"

### Cleanup! ###

__CMD='rm -rf ./coverage'

subpath_run_cmd ${__SRC_PATH} "$__CMD"
