#!/usr/bin/env bash

sentry-cli releases new -p client $VERSION
# sentry-cli releases set-commits $VERSION --auto

PATH="$(pwd)/.devcache/zopfli:$PATH" npm run build

# sentry-cli releases files $VERSION upload-sourcemaps --rewrite ./dest/
