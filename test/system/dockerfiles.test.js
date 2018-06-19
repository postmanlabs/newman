/**
 * @fileoverview This test suite runs tests on the various versions of newman-docker.
 */

var fs = require('fs'),
    path = require('path'),
    DockerFileValidator = require('dockerfile_lint');

/* global describe, it, expect */
describe('Validate Dockerfiles', function () {
    var imagesBaseDirectory = path.join(__dirname, '../../docker/images'),
        images = fs.readdirSync(imagesBaseDirectory).filter(function (item) {
            return fs.statSync(path.join(imagesBaseDirectory, item)).isDirectory();
        }),
        validator = new DockerFileValidator(path.join(__dirname, 'dockerfile_rules.yml'));

    images.forEach(function (version) {
        var dockerFilePath = path.join(imagesBaseDirectory, version, 'Dockerfile'),
            dockerFileContent = fs.readFileSync(dockerFilePath);

        it('should have valid Docker file for "' + version + '"', function () {
            var result = validator.validate(dockerFileContent.toString()),
                faults = result.error.count + result.warn.count;

            faults && console.error(JSON.stringify(result, null, 4)); // Helps debugging on the CI
            expect(faults, `there are ${faults} error(s)`).to.equal(0);
        });
    });
});
