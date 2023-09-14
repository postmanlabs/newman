FROM ubuntu:22.04
LABEL maintainer="Postman Labs <help@postman.com>"

ARG NODE_MAJOR=16
ARG NEWMAN_VERSION

# Bail out early if NEWMAN_VERSION is not provided
RUN if [ ! $(echo $NEWMAN_VERSION | grep -oE "^[0-9]+\.[0-9]+\.[0-9]+$") ]; then \
        echo "\033[0;31mA valid semver Newman version is required in the NEWMAN_VERSION build-arg\033[0m"; \
        exit 1; \
    fi

RUN apt-get update; \

    # Download and import the Nodesource GPG key
    apt-get install -y ca-certificates curl gnupg; \
    mkdir -p /etc/apt/keyrings; \
    curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
     | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg; \

    # Create deb repository
    echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$NODE_MAJOR.x nodistro main" \
     | tee /etc/apt/sources.list.d/nodesource.list; \

    # Run Update and Install
    apt-get update; \
    apt-get install nodejs -y; \

    # Install Newman globally
    npm install --global newman@${NEWMAN_VERSION};

# Set environment variables
ENV LC_ALL="en_US.UTF-8" LANG="en_US.UTF-8" LANGUAGE="en_US.UTF-8"

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
# docker run -v /home/collections:/etc/newman -t postman/newman_ubuntu run YourCollection.json.postman_collection \
#                                                                          -e YourEnvironment.postman_environment \
#                                                                          -H newman_report.html
ENTRYPOINT ["newman"]
