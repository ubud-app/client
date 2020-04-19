#!/usr/bin/env bash

sentry-cli releases finalize ${VERSION}
curl -X "POST" "https://beacon.ubud.club/webhooks/update-components/${NOTIFY_WEBHOOK_SECRET}"
