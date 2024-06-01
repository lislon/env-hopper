#!/bin/bash
set -e

if [ "$1" = 'start' ]; then
    npx prisma migrate deploy
    exec node ./main.js "$@"
fi
exec "$@"
