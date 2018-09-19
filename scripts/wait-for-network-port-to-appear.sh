#!/bin/bash -eu

echo "***** Waiting for network port '$1' ..."
while ! nc -z localhost "$1"; do sleep 1s; done
echo "***** Network port '$1' became available!"
