describe('travis.yml', function () {
    var fs = require('fs'),
        yaml = require('js-yaml'),
        travisYAML,
        travisYAMLError;

    try {
        travisYAML = yaml.safeLoad(fs.readFileSync('.travis.yml').toString());
    }
    catch (e) {
        travisYAMLError = e;
    }

    it('should exist', function (done) {
        fs.stat('.travis.yml', done);
    });

    it('should be a valid yml', function () {
        expect(travisYAMLError && travisYAMLError.message || travisYAMLError).to.not.be.ok;
    });

    describe('structure', function () {
        it('should have language to be set to node', function () {
            expect(travisYAML.language).to.equal('node_js');
            expect(travisYAML.node_js).to.eql(['6', '8', '10']);
        });

        it('should install required apt packages', function () {
            expect(travisYAML.addons).to.eql({
                apt: {
                    packages: ['gnome-keyring', 'libsecret-1-dev', 'python-gnomekeyring']
                }
            });
        });

        it('should export the display correctly', function () {
            expect(travisYAML.before_install).to.be.an.instanceOf(Array).that.is.not.empty;
        });
    });
});
