#!/usr/bin/env bash

source $(dirname $0)/_head.sh

################################################################
### Update paths to have src/* file in coverage report       ###
### https://github.com/codacy/node-codacy-coverage/issues/26 ###
################################################################
SEARCH_VALUE=$(pwd -P)"/"
REPLACE_VALUE=""

sed -e "s@${SEARCH_VALUE}@${REPLACE_VALUE}@g" ${__SRC_PATH}"/coverage/lcov.info" > ${__SRC_PATH}"/coverage/coverage.info"

######################################
### Upload Coverage info to Codacy ###
######################################
cat ${__SRC_PATH}"/coverage/coverage.info" | codacy-coverage --debug

#####################################################################
### Log top 20 file paths to be able see paths format from travis ###
#####################################################################
head -n 20 ${__SRC_PATH}"/coverage/coverage.info"

#############################################
### Cleanup! Remove all generated reports ###
#############################################
__CMD='rm -rf ./coverage'

subpath_run_cmd ${__SRC_PATH} "$__CMD"
