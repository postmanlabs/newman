FROM ubuntu:14.04.2
LABEL maintainer="Postman Labs <help@postman.com>"

ARG NODE_VERSION=10
ARG NEWMAN_VERSION

# Bail out early if NODE_VERSION is not provided
RUN if [ ! $(echo $NEWMAN_VERSION | grep -oE "^[0-9]+\.[0-9]+\.[0-9]+$") ]; then \
        echo "\033[0;31mA valid semver Newman version is required in the NEWMAN_VERSION build-arg\033[0m"; \
        exit 1; \
    fi

# Install node
ADD https://deb.nodesource.com/setup_$NODE_VERSION.x /opt/install_node.sh

RUN bash /opt/install_node.sh && \
    apt-get install -y nodejs && \
    npm install -g newman@${NEWMAN_VERSION} && \
    rm /opt/install_node.sh;

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
# docker run -v /home/collections:/etc/newman -t postman/newman_ubuntu1404 -c YourCollection.json.postman_collection \
#                                                                          -e YourEnvironment.postman_environment \
#                                                                          -H newman_report.html
ENTRYPOINT ["newman"]
