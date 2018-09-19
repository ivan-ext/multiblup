#!/bin/bash -eu

docker images                          || true
echo
docker ps -a                           || true
echo
docker network ls --filter type=custom || true
