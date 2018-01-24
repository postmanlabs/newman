function build_docker_image {
    BASENAME=$(basename $1)
    IMAGE_NAME="newman_$BASENAME"
	docker build -t "$DOCKER_ID_USER/$IMAGE_NAME:$TRAVIS_TAG" .
	if docker images | grep -q "$DOCKER_ID_USER/$IMAGE_NAME"; then
		echo "Image built"
		if docker run -t "$DOCKER_ID_USER/$IMAGE_NAME:$TRAVIS_TAG" run "https://www.getpostman.com/collections/8a0c9bc08f062d12dcda"; then
			echo "Collection run successfully"
			docker login -u "$DOCKER_ID_USER" -p "$DOCKER_ID_PASSWORD"
			docker push "$DOCKER_ID_USER/$IMAGE_NAME:$TRAVIS_TAG"
		else
			echo "Collection not run successfully"
		fi
	else
		echo "Image not built"
	fi
}

NODE_V=$(node -v | grep -o "v.")

IMAGES_BASE_PATH="./docker/images"
if [ -n "$TRAVIS_TAG" ] && [ "$NODE_V" = "v8" ]; then
	for image in $IMAGES_BASE_PATH/*; do
	    if [ -d "${image}" ] && [ -f "${image}/Dockerfile" ]; then
	    	cp "${image}/Dockerfile" .
	        build_docker_image ${image};
	        rm -f ./Dockerfile
	    fi
    done
fi
