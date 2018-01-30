#!/bin/bash
function build_docker_image {
    BASENAME=$(basename $1);
    TAG="$2";
    IMAGE_NAME="newman_$BASENAME";
    docker build -t "$DOCKER_ID_USER/$IMAGE_NAME:$TAG" -t "$DOCKER_ID_USER/$IMAGE_NAME:latest" --build-arg newman_version="$TAG" .;
    if docker images | grep -q "$DOCKER_ID_USER/$IMAGE_NAME"; then
        echo "Image built";
        PWD=$(pwd);
        if docker run -v "$PWD/examples:/etc/newman" -t "$DOCKER_ID_USER/$IMAGE_NAME:$TAG" run "sample-collection.json"; then
            echo "Collection run successfully";
            docker login -u "$DOCKER_ID_USER" -p "$DOCKER_ID_PASSWORD";
            docker push "$DOCKER_ID_USER/$IMAGE_NAME:$TAG" "$DOCKER_ID_USER/$IMAGE_NAME:latest";
        else
            echo "Collection not run successfully";
        fi
    else
        echo "Image $BASENAME:$TAG and $BASENAME:latest not built";
    fi
}
IMAGES_BASE_PATH="./docker/images";
TAG="$npm_package_version";
if [ -z "$TAG" ]; then
    TAG=$(grep "\"version\":\ " package.json | grep -o "[0-9]\+\.[0-9]\+\.[0-9]\+");
fi
if [ -n "$TAG" ]; then
    for image in $IMAGES_BASE_PATH/*; do
        if [ -f "${image}/Dockerfile" ]; then
            cp "${image}/Dockerfile" .;
            build_docker_image ${image} ${TAG};
            rm -f ./Dockerfile;
        fi
    done
fi
