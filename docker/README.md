<img src="https://s3.amazonaws.com/web-artefacts/cartoon-whale-8.gif+(400%C3%97225).png">

# newman-docker

This repository contains docker images for Newman.

<a href="https://github.com/postmanlabs/newman" target="_blank">Newman</a> is a command-line collection runner for
<a href="https://postman.com" target="_blank">Postman</a>. It allows you to effortlessly run and test a
<a href="https://learning.postman.com/docs/sending-requests/intro-to-collections" target="_blank">Postman Collections<a/> directly from the
command-line. It is built with extensibility in mind so that you can easily integrate it with your continuous
integration servers and build systems.

**New to Docker?** Docker allows you to package an application with all of its dependencies into a standardised unit for
software development. Visit
<a href="https://www.docker.com/whatisdocker" target="_blank">https://www.docker.com/whatisdocker</a> to read more about
how docker can drastically simplify development and deployment.

## There are two available Docker images for Newman
### postman/newman:alpine (lightweight):
   * <a href="https://hub.docker.com/r/postman/newman/">DockerHub</a>
   * <a href="https://github.com/postmanlabs/newman/tree/develop/docker/images/alpine">Documentation</a>

### postman/newman:ubuntu:
   * <a href="https://hub.docker.com/r/postman/newman/">DockerHub</a>
   * <a href="https://github.com/postmanlabs/newman/tree/develop/docker/images/ubuntu">Documentation</a>

## Using the docker image

The docker image for Newman is available for download from our docker hub. You must have Docker installed in your
system. Docker has extensive <a href="https://docs.docker.com/installation/" target="_blank">installation guideline for
popular operating systems</a>. Choose your operating system and follow the instructions.

> Ensure you that you have docker installed and running in your system before proceeding with next steps. A quick test
> to see if docker is installed correctly is to execute the command `docker run hello-world` and it should run without
> errors.

**Step 1:**

Pull the <a href="https://registry.hub.docker.com/u/postman/newman:ubuntu/" target="_blank">newman docker
image</a> from docker hub:

```terminal
docker pull postman/newman:ubuntu
```

**Step 2:**

Run newman commands on the image:

```terminal
docker run -t postman/newman:ubuntu run https://www.getpostman.com/collections/8a0c9bc08f062d12dcda
```

### Build the docker image from this repository


**Step 1:**

Clone this repository:

```terminal
git clone https://github.com/postmanlabs/newman.git
```

**Step 2:**

Build the image:

```terminal
docker build -t postman/newman:ubuntu --build-arg NEWMAN_VERSION="full semver version" .;
```

**Step 3:**

Run a collection using the newman image:

```terminal
docker run -t postman/newman:ubuntu run https://www.getpostman.com/collections/8a0c9bc08f062d12dcda
```


## Running local collection files

This docker image is designed to pick files from the `/etc/newman` directory within the image. You may mount the
directory of your collection files into that location and provide the file references in standard newman parameters.


```terminal
# Mount host collections folder ~/collections, onto /etc/newman on the docker image, so that newman
# has access to collections
docker run -v ~/collections:/etc/newman -t postman/newman:ubuntu run "HTTPBinNewmanTestNoEnv.json.postman_collection"
```

You are not required to mount a volume if you do not need to save newman report to the host, and your collection is
available online, unless your collection requires an environment(as environments cannot be passed as URLs).

To know more about mounting volumes, visit
<a href="https://docs.docker.com/userguide/dockervolumes/" target="_blank">docker documentation on shared data volumes</a>.


## Examples

Run a local collection, pass an environment to it, and save the JSON report on the host.

```terminal
docker run -v ~/collections:/etc/newman -t postman/newman:ubuntu \
    run "HTTPBinNewmanTest.json.postman_collection" \
    --environment="HTTPBinNewmanTestEnv.json.postman_environment" \
    --reporters="json,cli" --reporter-json-export="newman-results.json"
```

<br />Run a remote collection, pass it a local environment, and save JUnit XML test report on the host

```terminal
docker run -v ~/collections:/etc/newman -t postman/newman:ubuntu \
    run https://www.getpostman.com/collections/8a0c9bc08f062d12dcda \
    --environment="HTTPBinNewmanTestEnv.json.postman_environment" \
    --reporters="junit,cli" --reporter-junit-export="newman-report.xml"
```

<br />Use a script to run a collection and do something, for example deploy the build, if all the tests pass

```bash
#/bin/bash

# stop on first error
set -e;

function onExit {
    if [ "$?" != "0" ]; then
        echo "Tests failed";
        # build failed, don't deploy
        exit 1;
    else
        echo "Tests passed";
        # deploy build
    fi
}

# call onExit when the script exits
trap onExit EXIT;

docker run --entrypoint -t postman/newman:ubuntu run https://www.getpostman.com/collections/8a0c9bc08f062d12dcda --suppress-exit-code;
```

## Using Newman Docker images with custom reporters
Newman Docker images can also be used with custom Newman reporters, as follows:
```console
docker run -v "<collection-directory>:/etc/newman" --entrypoint /bin/<bash-or-sh> <image:tag> -c "npm i -g newman-reporter-<reporter-name>; newman run sample-collection.json -r <reporter-name>"
```

In the above example,
* `<collection-directory>` is the source directory for collections. This directory will also be used to write Newman reports.
* `<image>` is a combination of the image name (and optional tag). For instance, `postman/newman:ubuntu` or `postman/newman:alpine`
* `<reporter-name>` is the reporter that has to be installed and loaded for the `newman run ...`

### Alpine
Note that the entrypoint here is `/bin/sh`, and **not** `/bin/bash`
```console
docker run -v "~/collections:/etc/newman" --entrypoint /bin/sh postman/newman:alpine -c "npm i -g newman-reporter-html; newman run sample-collection.json -r html"
```

### Ubuntu
```console
docker run -v "~/collections:/etc/newman" --entrypoint /bin/bash postman/newman:ubuntu -c "npm i -g newman-reporter-html; newman run sample-collection.json -r html"
```

## Node version
All official Newman Docker images will be shipped with the current Node LTS (Long Term Support) version. To learn more
about the Node release schedule, see https://github.com/nodejs/Release#release-schedule. More details about individual
Docker images can be found in their individual READMEs in this folder.

[![Analytics](https://ga-beacon.appspot.com/UA-43979731-9/newman-docker/readme)](https://postman.com)
