FROM alpine:3.3
LABEL maintainer="Postman Labs <help@postman.com>"

ARG NODE_VERSION=10
ARG NEWMAN_VERSION

# Set environment variables
ENV LC_ALL="en_US.UTF-8" LANG="en_US.UTF-8" LANGUAGE="en_US.UTF-8" ALPINE_NODE_REPO="oznu/alpine-node"

# Bail out early if NODE_VERSION is not provided
RUN if [ ! $(echo $NEWMAN_VERSION | grep -oE "^[0-9]+\.[0-9]+\.[0-9]+$") ]; then \
        echo "\033[0;31mA valid semver Newman version is required in the NEWMAN_VERSION build-arg\033[0m"; \
        exit 1; \
    fi && \
    # Add the latest Alpine Linux package to the repositories list
    echo -e "https://nl.alpinelinux.org/alpine/v3.3/main/\nhttps://nl.alpinelinux.org/alpine/v3.3/community/" > /etc/apk/repositories && \
    # Update existing packages and install Node dependencies
    apk add --update --no-cache libgcc libstdc++ jq curl && \
    # Determine the complete Semver Node version for the provided Node major version in $NODE_VERSION
    FULL_NODE_VERSION=$(curl --silent "https://api.github.com/repos/${ALPINE_NODE_REPO}/releases" | jq -r '.[].tag_name' | grep -oE "^${NODE_VERSION}\.\d+\.\d+$" | sort -r -t. -k 1,1nr -k 2,2nr -k 3,3nr | head -n1) && \
    # Download the appropriate Node binary for Alpine Linux
    curl --silent -L "https://github.com/${ALPINE_NODE_REPO}/releases/download/${FULL_NODE_VERSION}/node-v${FULL_NODE_VERSION}-linux-x86_64-alpine.tar.gz" > /etc/alpine-node-${NODE_VERSION}.tar.gz && \
    # Extract and install Node from the binary downloaded in the previous step
    tar -xzf /etc/alpine-node-${NODE_VERSION}.tar.gz -C /usr --no-same-owner && \
    # Install Newman globally
    npm install --global newman@${NEWMAN_VERSION} && \
    # Prune redundant packages
    apk del jq curl && \
    # Clear Alpine Node binary
    rm /etc/alpine-node-${NODE_VERSION}.tar.gz;

# Set workdir to /etc/newman
# When running the image, mount the directory containing your collection to this location
#
# docker run -v <path to collections directory>:/etc/newman ...
#
# In case you mount your collections directory to a different location, you will need to give absolute paths to any
# collection, environment files you want to pass to newman, and if you want newman reports to be saved to your disk.
# Or you can change the workdir by using the -w or --workdir flag
WORKDIR /etc/newman

# Set newman as the default container command
# Now you can run the container via
#
# docker run -v /home/collections:/etc/newman -t postman/newman_alpine33 run YourCollection.json.postman_collection \
#                                                                        -e YourEnvironment.postman_environment \
#                                                                        -H newman_report.html
ENTRYPOINT ["newman"]
