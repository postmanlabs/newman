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

    describe('strucure', function () {
        it('should have language to be set to node', function () {
            expect(travisYAML.language).to.equal('node_js');
            expect(travisYAML.node_js).to.eql(['6', '8', '10', '12']);
        });
    });
});
