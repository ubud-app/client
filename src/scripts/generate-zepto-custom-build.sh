#!/usr/bin/env bash
set -e

PROJ_DIR=`pwd`
if [[ -f "${PROJ_DIR}/dest/zepto.js" ]]; then
  echo "Zepto.js already exists, skip!"
  exit 0
fi
if [[ -f "${PROJ_DIR}/.devcache/zepto.js" ]]; then
  cp "${PROJ_DIR}/.devcache/zepto.js" "${PROJ_DIR}/dest/zepto.js"
  echo "Used cached file."
  exit 0
fi

WORK_DIR=`mktemp -d`
if [[ ! "$WORK_DIR" || ! -d "$WORK_DIR" ]]; then
  echo "Could not create temp dir"
  exit 1
fi

git clone "https://github.com/madrobby/zepto.git" "${WORK_DIR}/zepto"
cd "${WORK_DIR}/zepto"

npm i

MODULES="zepto event data" npm run-script dist

mkdir -p "${PROJ_DIR}/dest"
cp "${WORK_DIR}/zepto/dist/zepto.js" "${PROJ_DIR}/dest/zepto.js"

mkdir -p "${PROJ_DIR}/.devcache"
cp "${WORK_DIR}/zepto/dist/zepto.js" "${PROJ_DIR}/.devcache/zepto.js"

cd ${PROJ_DIR}
rm -rf ${WORK_DIR}
