#!/bin/bash -eu

IMAGE_BASE="$1"
IMAGE_TAG="$2"
CONTAINER_SUFFIX="$3"
CONTAINER_PORT="$4"

continuous/scripts/process-template.sh 'continuous/docker/docker-compose.template.yml' 'continuous/docker/docker-compose.yml' \
	"$IMAGE_BASE" "$IMAGE_TAG" "$CONTAINER_SUFFIX" "$CONTAINER_PORT"
continuous/scripts/process-template.sh 'continuous/docker/web/Dockerfile.template'     'continuous/docker/web/Dockerfile' \
	"$IMAGE_BASE" "$IMAGE_TAG" "$CONTAINER_SUFFIX" "$CONTAINER_PORT"
