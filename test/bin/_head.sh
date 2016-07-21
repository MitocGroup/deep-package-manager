#!/usr/bin/env bash

__SCRIPT_PATH=$(cd $(dirname $0); pwd -P)
__RES_PATH="${__SCRIPT_PATH}/../resources"

__ROOT_PATH="${__SCRIPT_PATH}/../../"
__SRC_PATH="${__ROOT_PATH}src/"

__UPPER_CASE_TRAVIS_BRANCH=`echo "$TRAVIS_BRANCH" | tr '[:lower:]' '[:upper:]'`
__CODECLIMATE_TOKEN_NAME="CODECLIMATE_REPO_TOKEN_${__UPPER_CASE_TRAVIS_BRANCH}"

subpath_run_cmd () {
    local DIR
    local CMD
    local EXIT_CODE=0

    DIR=$(cd $1 && pwd -P)
    CMD=$2

    cd $DIR && eval_or_exit "$CMD"

    EXIT_CODE=$((EXIT_CODE+$?))

    exit $EXIT_CODE
}

function eval_or_exit() {
    eval "$1"

    local RET_CODE=$?

    if [[ ${RET_CODE} != 0 ]]  &&  [[ $1 == "npm run test" ]]; then
        #Run DEBUG_TEST_CMD command to show error in log
        echo "[FAILED] $1 -> try to re-run to show error in debug mode"
        local DEBUG_TEST_CMD="babel-node `which _mocha` --ui tdd --recursive --reporter spec"
        eval_or_exit "$DEBUG_TEST_CMD"
    elif [ ${RET_CODE} != 0 ]; then
        echo "[FAILED] $1"
        exit 1
    else
        echo "[SUCCEED] $1"
    fi
}

#############################################################################
### Checks if all environment variables available for validating coverage ###
### Arguments:                                                            ###
###   None                                                                ###
### Returns:                                                              ###
###   0 or 1                                                              ###
#############################################################################
IS_ENV_VARS_AVAILABLE () {
  if [ -z $GITHUB_OAUTH_TOKEN ] || [ -z $AWS_ACCESS_KEY_ID ] || [ -z AWS_SECRET_ACCESS_KEY ] || \
    [ -z $S3_BUCKET_NAME ] || [ -z $AWS_DEFAULT_REGION ]; then
    echo 0;

    return;
  fi

  echo 1;
}

#################################################################
### Checks if codeclimate token available for specific branch ###
### Arguments:                                                ###
###   None                                                    ###
### Returns:                                                  ###
###   0 or 1                                                  ###
#################################################################
IS_CODECLIMATE_TOKEN_AVAILABLE () {

  if [ -z `printenv $__CODECLIMATE_TOKEN_NAME` ]; then
    echo 0;

    return;
  fi

  echo 1;
}