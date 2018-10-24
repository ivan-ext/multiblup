#!/bin/bash -eu

echo "***** Waiting for ready-file '$1'..."
while [ ! -f "$1" ]; do sleep 1s; done
echo "***** Rready-file '$1' discovered. Removing it again."
rm -f "$1" || true
