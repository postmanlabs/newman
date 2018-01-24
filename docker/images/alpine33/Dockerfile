FROM alpine:3.3
MAINTAINER Postman Labs <help@getpostman.com>

# Set node version
# Can't upgrade to nodev8 because it isn't supported in alpine 3.3
ENV NODE_VERSION 4.3.2

# Set locale
ENV LC_ALL en_US.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

# Install node
RUN apk add --update nodejs=${NODE_VERSION}-r1;

RUN mkdir newman

ADD . /newman

RUN npm install -g /newman

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