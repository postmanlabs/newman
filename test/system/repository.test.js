/**
 * @fileOverview This test specs runs tests on the package.json file of repository. It has a set of strict tests on the
 * content of the file as well. Any change to package.json must be accompanied by valid test case in this spec-sheet.
 */
var fs = require('fs'),
    path = require('path'),
    _ = require('lodash'),
    yml = require('js-yaml'),
    semver = require('semver'),
    parseIgnore = require('parse-gitignore');

describe('project repository', function () {
    describe('package.json', function () {
        var content,
            json;

        try {
            content = fs.readFileSync('./package.json').toString();
            json = JSON.parse(content);
        }
        catch (e) {
            console.error(e);
            content = '';
            json = {};
        }

        it('should have readable JSON content', function () {
            expect(content).to.be.ok;
            expect(json).to.not.eql({});
        });

        describe('package.json JSON data', function () {
            it('should have valid name, description and author', function () {
                expect(json).to.have.property('name', 'newman');
                expect(json).to.have.property('description', 'Command-line companion utility for Postman');
                expect(json).to.have.property('author', 'Postman Labs <help@getpostman.com> (=)');
                expect(json).to.have.property('license', 'Apache-2.0');
                expect(json).to.have.property('homepage', 'https://github.com/postmanlabs/newman');
                expect(json).to.have.property('bugs', 'https://github.com/postmanlabs/newman/issues');

                expect(json).to.have.property('repository');
                expect(json.repository).to.eql({
                    type: 'git',
                    url: 'git://github.com/postmanlabs/newman.git'
                });

                expect(json).to.have.property('keywords');
                expect(json.keywords).to.eql(['newman', 'postman', 'api', 'testing', 'ci', 'rest-client', 'rest']);

                expect(json).to.have.property('engines');
                expect(json.engines).to.eql({ node: '>=6' });
            });

            it('should ignore applicable dependencies for GreenKeeper pull requests', function () {
                expect(json.greenkeeper).to.eql({ ignore: [] });
            });

            it('should have a valid version string in form of <major>.<minor>.<revision>', function () {
                expect(semver.valid(json.version), `version:${json.version} should be a valid semver`).to.not.be.null;
            });
        });

        describe('binary definitions', function () {
            it('should exist', function () {
                expect(json.bin).be.ok;
                expect(json.bin).to.eql({ newman: './bin/newman.js' });
            });

            it('should have valid node shebang', function () {
                json.bin && Object.keys(json.bin).forEach(function (scriptName) {
                    var fileContent = fs.readFileSync(json.bin[scriptName]).toString();

                    expect((/^#!\/(bin\/bash|usr\/bin\/env\snode)[\r\n][\W\w]*$/g).test(fileContent),
                        `invalid or missing shebang in ${json.bin[scriptName]}`).to.be.ok;
                });
            });
        });

        describe('script definitions', function () {
            it('should exist', function () {
                expect(json.scripts).to.be.ok;
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    var name = json.scripts[scriptName];

                    name = name.replace(/^(node\s|\.\/)/, '');
                    fs.stat(name, function (err) {
                        var fileDetails = path.parse(name);

                        expect(err).to.equal(null);
                        expect(fileDetails.ext).to.match(/^\.(sh|js)$/);
                    });
                });
            });

            it('should have the hashbang defined', function () {
                expect(json.scripts).to.be.ok;
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    var fileDetails,
                        name = json.scripts[scriptName].replace(/^(node\s|\.\/)/, '');

                    fileDetails = path.parse(name);
                    expect(fileDetails.ext).to.match(/^\.(sh|js)$/);

                    fs.readFile(name, function (error, content) {
                        expect(error).to.equal(null);
                        if (fileDetails.ext === '.sh') {
                            expect((/^#!\/bin\/bash[\r\n][\W\w]*$/g).test(content),
                                `invalid or missing hashbang in ${name}`).to.be.ok;
                        }
                        else {
                            expect((/^#!\/usr\/bin\/env\snode[\r\n][\W\w]*$/g).test(content),
                                `invalid or missing hashbang in ${name}`).to.be.ok;
                        }
                    });
                });
            });
        });

        describe('dependencies', function () {
            it('should exist', function () {
                expect(json.dependencies).to.be.an('object');
            });

            it('should point to a valid and precise (no * or ^) semver', function () {
                json.dependencies && Object.keys(json.dependencies).forEach(function (item) {
                    expect(semver.valid(json.dependencies[item]),
                        `${item}:${json.dependencies[item]} should be a valid semver`).to.not.be.null;
                });
            });
        });

        describe('devDependencies', function () {
            it('should exist', function () {
                expect(json.devDependencies).to.be.an('object');
            });

            it('should point to a valid and precise (no * or ^) semver', function () {
                json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
                    expect(semver.valid(json.devDependencies[item]),
                        `${item}:${json.devDependencies[item]} should be a valid semver`).to.not.be.null;
                });
            });

            it('should not overlap devDependencies', function () {
                var clean = [];

                json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
                    !json.dependencies[item] && clean.push(item);
                });

                expect(Object.keys(json.devDependencies)).to.eql(clean);
            });
        });

        describe('main entry script', function () {
            it('should point to a valid file', function (done) {
                expect(json.main).to.equal('index.js');
                fs.stat(json.main, done);
            });
        });
    });

    describe('README.md', function () {
        it('should exist', function (done) {
            fs.stat('./README.md', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./README.md').toString()).to.be.ok;
        });
    });

    describe('LICENSE.md', function () {
        it('should exist', function (done) {
            fs.stat('./LICENSE.md', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./LICENSE.md').toString()).to.be.ok;
        });
    });

    describe('.ignore files', function () {
        var gitignorePath = '.gitignore',
            npmignorePath = '.npmignore',
            npmignore = parseIgnore(fs.readFileSync(npmignorePath)),
            gitignore = parseIgnore(fs.readFileSync(gitignorePath));

        describe(gitignorePath, function () {
            it('should exist', function (done) {
                fs.stat(gitignorePath, done);
            });

            it('should have valid content', function () {
                expect(gitignore).to.not.be.empty;
            });
        });

        describe(npmignorePath, function () {
            it('should exist', function (done) {
                fs.stat(npmignorePath, done);
            });

            it('should have valid content', function () {
                expect(npmignore).to.not.be.empty;
            });
        });

        it('should have .gitignore coverage to be a subset of .npmignore coverage', function () {
            expect(_.intersection(gitignore, npmignore)).to.eql(gitignore);
        });
    });

    describe('.eslintrc', function () {
        it('should exist', function (done) {
            fs.stat('./.eslintrc', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./.eslintrc').toString()).to.be.ok;
        });
    });

    describe('.gitattributes', function () {
        it('should exist', function (done) {
            fs.stat('./.gitattributes', done);
        });

        it('should have readable content', function () {
            expect(fs.readFileSync('./.gitattributes').toString()).to.be.ok;
        });
    });

    describe('CHANGELOG.yaml', function () {
        it('should exist', function (done) {
            fs.stat('./CHANGELOG.yaml', done);
        });

        it('should have readable content', function () {
            expect(yml.safeLoad(fs.readFileSync('./CHANGELOG.yaml')), 'not a valid yaml').to.be.ok;
        });
    });
});
