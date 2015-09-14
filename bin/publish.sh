#!/usr/bin/env bash

source $(dirname $0)/_head.sh

assure_npm

DRY_RUN=false
HELP=false
VERSION_TYPE="patch"

for i in "$@"
do
    case ${i} in
        --patch)
        VERSION_TYPE="patch"
        ;;
        --minor)
        VERSION_TYPE="minor"
        ;;
        --major)
        VERSION_TYPE="major"
        ;;
        --help)
        HELP=true
        ;;
        --dry-run)
        DRY_RUN=true
        ;;
    esac

    shift
done

if ${HELP}; then
    echo "-------------------------------------------------------------------"
    echo "Usage example: bin/publish.sh --dry-run"
    echo ""
    echo "Arguments and options:"
    echo "      --dry-run    Skip uploading packages to NPM registry"
    echo "-------------------------------------------------------------------"
    exit 0
fi

if ${DRY_RUN}; then
    echo ""
    echo "Dry run mode on!!!"
    echo ""
fi

publish_npm_package ${path}"/../src" ${DRY_RUN} ${VERSION_TYPE}
