#!/bin/bash -eu

set -o pipefail

WEB="$1"
CONTENT="$2"

echo "***** Ensuring that the web resource '$WEB' contains '$CONTENT'"

set +o errexit
wget --read-timeout=5 --timeout=5 --tries=1 -q -O - "$WEB" | fgrep --quiet -- "$CONTENT"

if [ $? = 0 ]
then
	echo "***** SUCCESS: Web resource '$WEB' contains '$CONTENT'"
	exit 0
else
	echo "***** FAILED: Web resource '$WEB' does NOT contain '$CONTENT'"
	exit 1
fi
