#!/bin/bash

# Bail out on the first error
set -e;

BLUE='\033[0;34m';
NO_COLOUR='\033[0m';
DOCKER_USER="postman";
TAG=$npm_package_version;
IMAGES_BASE_PATH="./docker/images";

# It's good to be paranoid
[[ -z "$TAG" ]] && TAG=$(jq -r ".version" < package.json);

function build_docker_image {
    local TAG="$2";
    local BASENAME=$(basename $1);
    local IMAGE_NAME="newman_$BASENAME";

    echo "";
    echo -e "$BLUE Building docker image for $DOCKER_USER/$IMAGE_NAME:$TAG, latest $NO_COLOUR";
    docker build \
        --no-cache --force-rm --squash \
        -t "$DOCKER_USER/$IMAGE_NAME:$TAG" -t "$DOCKER_USER/$IMAGE_NAME:latest" \
        --file="docker/images/$BASENAME/Dockerfile" --build-arg NEWMAN_VERSION="$TAG" .;

    echo -e "$BLUE Running docker image test for $DOCKER_USER/$IMAGE_NAME:$TAG, latest $NO_COLOUR";
    docker run -v "$PWD/examples:/etc/newman" -t "$DOCKER_USER/$IMAGE_NAME:$TAG" run "sample-collection.json";

    # prepare current images for pushing
    docker tag $DOCKER_USER/$IMAGE_NAME:$TAG $DOCKER_USER/$IMAGE_NAME:$TAG;
    docker tag $DOCKER_USER/$IMAGE_NAME:latest $DOCKER_USER/$IMAGE_NAME:latest;

    echo -e "$BLUE Pushing docker image for $DOCKER_USER/$IMAGE_NAME:$TAG, latest $NO_COLOUR";
    docker push $DOCKER_USER/$IMAGE_NAME:$TAG;
    docker push $DOCKER_USER/$IMAGE_NAME:latest;
}

for image in $IMAGES_BASE_PATH/*; do
    build_docker_image ${image} ${TAG};
done
