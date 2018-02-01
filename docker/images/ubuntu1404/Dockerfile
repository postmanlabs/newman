FROM ubuntu:14.04.2
MAINTAINER Postman Labs <help@getpostman.com>

# Install curl and npm

RUN apt-get install -y curl;

RUN curl -sS https://deb.nodesource.com/setup_8.x | sudo -E bash -

RUN apt-get clean && apt-get upgrade -y && apt-get update -y --fix-missing && apt-get install -y nodejs

# Set node version
ENV NODE_VERSION 8

# Set locale
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

# Install node
RUN npm install -g n;
RUN n ${NODE_VERSION};

ARG newman_version
ENV NEWMAN_VERSION=$newman_version

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
# docker run -v /home/collections:/etc/newman -t postman/newman_ubuntu1404 -c YourCollection.json.postman_collection \
#                                                                          -e YourEnvironment.postman_environment \
#                                                                          -H newman_report.html

ENTRYPOINT ["newman"]