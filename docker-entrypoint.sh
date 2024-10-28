#!/bin/bash
set -e

if [ "$1" = 'start' ]; then
    npx prisma migrate deploy
    exec node ./server.js "$@"
fi
exec "$@"
