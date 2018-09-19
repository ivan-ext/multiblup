#!/bin/bash

set -o pipefail

echo -n "$@" | tr '[:upper:]' '[:lower:]' | sed 's/[^[:alpha:][:digit:]\/\:]/_/g'
