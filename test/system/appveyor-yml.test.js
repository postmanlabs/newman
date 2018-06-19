/* global describe, it, expect */

describe('appveyor.yml', function () {
    var fs = require('fs'),
        yaml = require('js-yaml'),

        appveyorYAML,
        appveyorYAMLError;

    try {
        appveyorYAML = yaml.safeLoad(fs.readFileSync('.appveyor.yml').toString());
    }
    catch (e) {
        appveyorYAMLError = e;
    }

    it('should exist', function (done) {
        fs.stat('.appveyor.yml', done);
    });

    it('should be a valid yml', function () {
        expect(appveyorYAMLError && appveyorYAMLError.message || appveyorYAMLError).to.be.undefined;
    });

    describe('strucure', function () {
        it('should have init script', function () {
            expect(appveyorYAML.init[0]).to.equal('git config --global core.autocrlf input');
        });

        it('should match environment matrix that of Travis', function () {
            var travisYAML,
                travisYAMLError,
                appveyorNodeVersions = appveyorYAML.environment.matrix.map(function (member) {
                    return member.nodejs_version;
                });

            try {
                travisYAML = yaml.safeLoad(fs.readFileSync('.travis.yml').toString());
            }
            catch (e) {
                travisYAMLError = e;
            }

            !travisYAMLError && expect(travisYAML.node_js).to.eql(appveyorNodeVersions);
        });

        it('should have a valid install pipeline', function () {
            expect(appveyorYAML.install[0].ps).to.equal('Install-Product node $env:nodejs_version');
            expect(appveyorYAML.install[1]).to.equal('npm cache clean --force');
            expect(appveyorYAML.install[2]).to.equal('appveyor-retry npm install');
        });

        it('should have MS build script and deploy to be turned off', function () {
            expect(appveyorYAML.build).to.equal('off');
            expect(appveyorYAML.deploy).to.equal('off');
        });

        it('should have notifications configured correctly', function () {
            expect(appveyorYAML.notifications).to.be.an('array');
            expect(appveyorYAML.notifications[0].provider).to.equal('Slack');
            expect(appveyorYAML.notifications[0].incoming_webhook.secure,
                '"secure" not configured in incoming_webhook').to.be.ok;
        });
    });
});
