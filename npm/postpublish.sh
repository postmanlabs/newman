#!/usr/bin/env bash

# Bail out on the first error
set -eo pipefail;

LATEST="alpine";
BLUE="\033[0;34m";
NO_COLOUR="\033[0m";
DOCKER_REPO="postman/newman";
VERSION=${npm_package_version};
IMAGES_BASE_PATH="./docker/images";
GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD);

# It's good to be paranoid
[[ -z "$VERSION" ]] && VERSION=$(jq -r ".version" < package.json);

MAJOR=$(echo ${VERSION} | grep -oE "^\d+");
MINOR=$(echo ${VERSION} | grep -oE "^\d+\.\d+");

function validate_docker_image {
    local OS="$(basename $1)"
    local IMAGE_NAME="newman-test-$OS";

    echo "";

    echo -e "$BLUE Building Docker image (OS: $OS) for local image validation test $NO_COLOUR";

    docker build \
        --no-cache \
        --force-rm \
        -t $IMAGE_NAME \
        --file="docker/images/$OS/Dockerfile" \
        --build-arg NEWMAN_VERSION=${VERSION} \
        .;

    echo -e "$BLUE Running Docker image (OS: $OS) test $NO_COLOUR";

    # Test
    docker run -v ${PWD}/examples:/etc/newman --rm -t $IMAGE_NAME run "sample-collection.json";

    echo -e "$BLUE Removing Docker image (OS: $OS) from local Docker $NO_COLOUR";
    docker rmi $IMAGE_NAME
}

function build_docker_image {
    local OS="$(basename $1)"

    local TAGS=""

    echo "";

    if [[ ${GIT_BRANCH} == "master" ]]; then
        TAGS="$TAGS -t ${DOCKER_REPO}:${OS}"

        if [[ ${OS} == ${LATEST} ]]; then
            TAGS="$TAGS -t ${DOCKER_REPO}:latest";
            TAGS="$TAGS -t ${DOCKER_REPO}:${VERSION}";
            TAGS="$TAGS -t ${DOCKER_REPO}:${MINOR}";
            TAGS="$TAGS -t ${DOCKER_REPO}:${MAJOR}";
        fi
    fi

    TAGS="$TAGS -t ${DOCKER_REPO}:${VERSION}-${OS}";
    TAGS="$TAGS -t ${DOCKER_REPO}:${MINOR}-${OS}";
    TAGS="$TAGS -t ${DOCKER_REPO}:${MAJOR}-${OS}";

    echo -e "$BLUE Will now build and push multi-platform Docker image with tags $TAGS $NO_COLOUR";

    docker buildx build \
        --platform linux/amd64,linux/arm64 \
        --no-cache \
        --force-rm \
        ${TAGS} \
        --file="docker/images/$OS/Dockerfile" \
        --build-arg NEWMAN_VERSION=${VERSION} \
        --push \
        .;
}

for image in ${IMAGES_BASE_PATH}/*; do
    validate_docker_image ${image};
    build_docker_image ${image};
done
