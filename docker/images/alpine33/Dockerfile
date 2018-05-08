FROM alpine:3.3
MAINTAINER Postman Labs <help@getpostman.com>

ARG newman_version
# Bail out early if NODE_VERSION is not provided
RUN if [ ! $(echo $newman_version | grep -oE "^[0-9]+\.[0-9]+\.[0-9]+$") ]; then \
        echo "\033[0;31mA valid semver Newman version is required in the newman_version build-arg\033[0m"; \
        exit 1; \
    fi

# Can't upgrade to node v8 because it isn't supported in alpine 3.3
ENV NODE_VERSION 4.3.2

# Install node
RUN echo -e "http://nl.alpinelinux.org/alpine/v3.3/main\nhttp://nl.alpinelinux.org/alpine/v3.3/community" > /etc/apk/repositories && \
    apk add --update nodejs=${NODE_VERSION}-r1;

# Set environment variables
ENV LC_ALL="en_US.UTF-8" LANG="en_US.UTF-8" LANGUAGE="en_US.UTF-8" NEWMAN_VERSION=$newman_version

# Install newman
RUN npm install -g newman@${NEWMAN_VERSION};

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
# docker run -v /home/collections:/etc/newman -t postman/newman_alpine33 -c YourCollection.json.postman_collection \
#                                                                        -e YourEnvironment.postman_environment \
#                                                                        -H newman_report.html
ENTRYPOINT ["newman"]
