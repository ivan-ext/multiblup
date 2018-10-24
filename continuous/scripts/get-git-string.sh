#!/bin/bash -eu

set -o pipefail

master="$1"

branch=`      git rev-parse --abbrev-ref HEAD           | tr -d '\n'`
master_count=`git rev-list  --count      "${master}" -- | tr -d '\n'`

echo -n "${master_count}"

if [ "${branch}" != "${master}" ]
then
	echo -n '+' ; git rev-list --count "${master}..HEAD" | tr -d '\n'
fi

exit 0
