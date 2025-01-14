# Use Node 16 Alpine base image
FROM node:16-alpine
LABEL maintainer="Postman Labs <help@postman.com>"

# Define build argument for Newman version
ARG NEWMAN_VERSION
# Set environment variables for localization
ENV LC_ALL="en_US.UTF-8" LANG="en_US.UTF-8" LANGUAGE="en_US.UTF-8" ALPINE_NODE_REPO="oznu/alpine-node"

# Bail out early if NEWMAN_VERSION is not provided in a valid semver format
RUN if [ ! $(echo $NEWMAN_VERSION | grep -oE "^[0-9]+\.[0-9]+\.[0-9]+$") ]; then \
        echo "\033[0;31mA valid semver Newman version is required in the NEWMAN_VERSION build-arg\033[0m"; \
        exit 1; \
    fi && \
    # Install Newman globally with the specified version
    npm install --global newman@${NEWMAN_VERSION} && \
    # Update deprecated packages to avoid warnings
    npm install --global highlight.js@latest gulp-header@latest urix@latest resolve-url@latest && \
    # Install newman-reporter-htmlextra if needed
    npm install --global newman-reporter-htmlextra@latest

# Set work directory for the Newman collection
WORKDIR /etc/newman

# Set newman as the default container command
ENTRYPOINT ["newman"]

# Verify that newman and required dependencies are correctly installed
RUN newman --version && \
    npm list -g highlight.js gulp-header urix resolve-url newman-reporter-htmlextra
