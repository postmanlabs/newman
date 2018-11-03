#!/bin/bash

# Bail out on the first error
set -e;

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

function build_docker_image {
    local TAG=$(basename $1);

    echo "";

    echo -e "$BLUE Building $DOCKER_REPO:$VERSION-$TAG $NO_COLOUR";

    docker build \
        --no-cache --force-rm --squash -t ${DOCKER_REPO}:${VERSION}-${TAG} \
        --file="docker/images/$TAG/Dockerfile" --build-arg NEWMAN_VERSION=${VERSION} .;

    echo -e "$BLUE Running docker image test for $DOCKER_REPO:$VERSION-$TAG, latest $NO_COLOUR";

    # Test
    docker run -v ${PWD}/examples:/etc/newman -t ${DOCKER_REPO}:${VERSION}-${TAG} run "sample-collection.json";

    echo -e "$BLUE Pushing docker image for $DOCKER_REPO:$VERSION-$TAG $NO_COLOUR";

    # Tag
    if [[ ${GIT_BRANCH} == "master" ]]; then
        if [[ ${TAG} == "ubuntu1404" || ${TAG} == "alpine33" ]]; then
            docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}_${TAG}:latest;
            docker push ${DOCKER_REPO}_${TAG}:latest;
        else
            docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${TAG};
            docker push ${DOCKER_REPO}:${TAG};

            if [[ ${TAG} == ${LATEST} ]]; then
                docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:latest;
                docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${VERSION};
                docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${MINOR};
                docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${MAJOR};

                docker push ${DOCKER_REPO}:latest;
                docker push ${DOCKER_REPO}:${VERSION};
                docker push ${DOCKER_REPO}:${MINOR};
                docker push ${DOCKER_REPO}:${MAJOR};
            fi
        fi
    fi

    if [[ ${TAG} == "ubuntu1404" || ${TAG} == "alpine33" ]]; then
        docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}_${TAG}:${VERSION};
        docker push ${DOCKER_REPO}_${TAG}:${VERSION};
    else
        # Push
        docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${VERSION}-${TAG};
        docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${MINOR}-${TAG};
        docker tag ${DOCKER_REPO}:${VERSION}-${TAG} ${DOCKER_REPO}:${MAJOR}-${TAG};

        docker push ${DOCKER_REPO}:${VERSION}-${TAG};
        docker push ${DOCKER_REPO}:${MINOR}-${TAG};
        docker push ${DOCKER_REPO}:${MAJOR}-${TAG};
    fi
}

for image in ${IMAGES_BASE_PATH}/*; do
    build_docker_image ${image};
done
