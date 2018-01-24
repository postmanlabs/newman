function build_docker_image {
    BASENAME=$(basename $1);
    IMAGE_NAME="newman_$BASENAME";
    TAG="$2";
    docker build -t "$DOCKER_ID_USER/$IMAGE_NAME:$TAG" .
    if docker images | grep -q "$DOCKER_ID_USER/$IMAGE_NAME"; then
        echo "Image built"
        if docker run -t "$DOCKER_ID_USER/$IMAGE_NAME:$TAG" run "sample-collection.json"; then
            echo "Collection run successfully"
            docker login -u "$DOCKER_ID_USER" -p "$DOCKER_ID_PASSWORD"
            docker push "$DOCKER_ID_USER/$IMAGE_NAME:$TAG"
        else
            echo "Collection not run successfully"
        fi
    else
    	echo "Image $BASENAME:$TAG not built"
    fi
}

NODE_V=$(node -v | grep -o "v.")

IMAGES_BASE_PATH="./docker/images"
if [ -n "$TRAVIS_TAG" ] && [ "$NODE_V" = "v8" ]; then
    for image in $IMAGES_BASE_PATH/*; do
        if [ -d "${image}" ] && [ -f "${image}/Dockerfile" ]; then
            cp "${image}/Dockerfile" .
            build_docker_image ${image} ${TRAVIS_TAG};
            build_docker_image ${image} "latest";
            rm -f ./Dockerfile
        fi
    done
fi
