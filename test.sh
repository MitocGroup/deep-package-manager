if [ -n "${DEPLOY_ENV:-}" ]; then
  echo "${DEPLOY_ENV}"
else
  echo "Some default value because DEPLOY_ENV is undefined"
fi

