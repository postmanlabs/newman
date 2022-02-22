# newman:qase-alpine

This image runs newman on node v16 on Alpine with a Qase reporter installed. 

Build the image:

```terminal
docker build -t postman/newman:qase-alpine --build-arg NEWMAN_VERSION="full semver version" .
```

Or get it from [Docker Hub](https://registry.hub.docker.com/u/postman/newman/):

```terminal
docker pull postman/newman:qase-alpine
```

Then run it:

```terminal
docker --volume="/home/postman/collections:/etc/newman" -t postman/newman:qase-alpine run JSONBlobCoreAPI.json.postman_collection  -r qase \ # Enable Qase logger
    --reporter-qase-logging \ # Use reporter logger (like debug)
    --reporter-qase-projectCode PRJCODE \ # Specify Project Code
    --reporter-qase-apiToken <api token> \ # Specify API token
    --reporter-qase-runId 34 \ # Specify Run ID using CLI parameters
    --reporter-qase-runName "..." \ # Specify Run name using CLI parameters
    --reporter-qase-runDescription "..." \ # Specify Run description using CLI parameters
    -x # WA for issue https://github.com/postmanlabs/newman/issues/2148#issuecomment-665229759
```

Visit the [GitHub](https://github.com/qase-tms/qase-javascript/tree/master/qase-newman) repository of newman-reporter-qase for full details on how to use this reporter.
