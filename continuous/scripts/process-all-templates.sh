#!/bin/bash -eu

IMAGE_BASE="$1"
IMAGE_TAG="$2"
CONTAINER_SUFFIX="$3"
CONTAINER_PORT="$4"

scripts/process-template.sh 'docker/docker-compose.template.yml' 'docker/docker-compose.yml' \
	"$IMAGE_BASE" "$IMAGE_TAG" "$CONTAINER_SUFFIX" "$CONTAINER_PORT"
scripts/process-template.sh 'docker/web/Dockerfile.template'     'docker/web/Dockerfile' \
	"$IMAGE_BASE" "$IMAGE_TAG" "$CONTAINER_SUFFIX" "$CONTAINER_PORT"
