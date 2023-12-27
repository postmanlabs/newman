#!/bin/bash

# Bail out on the first error
set -e;

LATEST="alpine";
RED="\033[0;31m";
BLUE="\033[0;34m";
NO_COLOUR="\033[0m";
DOCKER_REPO="postman/newman";
VERSION=${npm_package_version};
IMAGES_BASE_PATH="./docker/images";
IMAGES_PLATFORMS="linux/amd64,linux/arm64";
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD);

if [[ ${GIT_BRANCH} != "main" ]]; then
    echo -e "$RED Not on main branch! $NO_COLOUR";
    exit 1;
fi

# It's good to be paranoid
[[ -z "$VERSION" ]] && VERSION=$(jq -r ".version" < package.json);

MAJOR=$(echo ${VERSION} | grep -oE "^\d+");

function build_docker_image {
    local TAG=$(basename $1);

    echo "";

    echo -e "$BLUE Building $DOCKER_REPO:$VERSION-$TAG $NO_COLOUR";

    if [[ ${TAG} == ${LATEST} ]]; then
        docker buildx build \
            --no-cache --file="docker/images/$TAG/Dockerfile" \
            --build-arg NEWMAN_VERSION=${VERSION} --push \
            --platform ${IMAGES_PLATFORMS} \
            --tag ${DOCKER_REPO}:latest \
            --tag ${DOCKER_REPO}:${TAG} \
            --tag ${DOCKER_REPO}:${VERSION} \
            --tag ${DOCKER_REPO}:${MAJOR} \
            --tag ${DOCKER_REPO}:${VERSION}-${TAG} \
            --tag ${DOCKER_REPO}:${MAJOR}-${TAG} \
            .
    else
        docker buildx build \
            --no-cache --file="docker/images/$TAG/Dockerfile" \
            --build-arg NEWMAN_VERSION=${VERSION} --push \
            --platform ${IMAGES_PLATFORMS} \
            --tag ${DOCKER_REPO}:${TAG} \
            --tag ${DOCKER_REPO}:${VERSION}-${TAG} \
            --tag ${DOCKER_REPO}:${MAJOR}-${TAG} \
            .
    fi

    echo -e "$BLUE Running docker image test for $DOCKER_REPO:$VERSION-$TAG, latest $NO_COLOUR";

    # Test
    docker run -v ${PWD}/examples:/etc/newman -t ${DOCKER_REPO}:${VERSION}-${TAG} run "sample-collection.json";
}

for image in ${IMAGES_BASE_PATH}/*; do
    build_docker_image ${image};
done
