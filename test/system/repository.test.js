/**
 * @fileOverview This test specs runs tests on the package.json file of repository. It has a set of strict tests on the
 * content of the file as well. Any change to package.json must be accompanied by valid test case in this spec-sheet.
 */
var expect = require('expect.js');

/* global describe, it */
describe('project repository', function () {
    var fs = require('fs');

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

        it('must have readable JSON content', function () {
            expect(content).to.be.ok();
            expect(json).to.not.eql({});
        });

        describe('package.json JSON data', function () {
            it('must have valid name, description and author', function () {
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
                expect(json.engines).to.eql({ node: '>=4' });
            });

            it('must have a valid version string in form of <major>.<minor>.<revision>', function () {
                // eslint-disable-next-line max-len
                expect(json.version).to.match(/^((\d+)\.(\d+)\.(\d+))(?:-([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?(?:\+([\dA-Za-z\-]+(?:\.[\dA-Za-z\-]+)*))?$/);
            });
        });

        describe('binary definitions', function () {

            it('must exits', function () {
                expect(json.bin).be.ok();
                expect(json.bin).to.eql({ 'newman': './bin/newman.js' });
            });

            it('must have valid node shebang', function () {
                json.bin && Object.keys(json.bin).forEach(function (scriptName) {
                    var fileContent = fs.readFileSync(json.bin[scriptName]).toString();
                    expect(/^#!\/(bin\/bash|usr\/bin\/env\snode)[\r\n][\W\w]*$/g.test(fileContent)).to.be.ok();
                });
            });

        });

        describe('script definitions', function () {
            it('files must exist', function () {
                expect(json.scripts).to.be.ok();
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    expect(fs.existsSync('npm/' + scriptName + '.js')).to.be.ok();
                });
            });

            it('must have the hashbang defined', function () {
                json.scripts && Object.keys(json.scripts).forEach(function (scriptName) {
                    var fileContent = fs.readFileSync('npm/' + scriptName + '.js').toString();
                    expect(/^#!\/(bin\/bash|usr\/bin\/env\snode)[\r\n][\W\w]*$/g.test(fileContent)).to.be.ok();
                });
            });
        });

        describe('dependencies', function () {
            it('must exist', function () {
                expect(json.dependencies).to.be.a('object');
            });

            it('must point to a valid and precise (no * or ^) semver', function () {
                json.dependencies && Object.keys(json.dependencies).forEach(function (item) {
                    expect(json.dependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                        '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$'));
                });
            });
        });

        describe('devDependencies', function () {
            it('must exist', function () {
                expect(json.devDependencies).to.be.a('object');
            });

            it('must point to a valid and precise (no * or ^) semver', function () {
                json.devDependencies && Object.keys(json.devDependencies).forEach(function (item) {
                    expect(json.devDependencies[item]).to.match(new RegExp('^((\\d+)\\.(\\d+)\\.(\\d+))(?:-' +
                        '([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?(?:\\+([\\dA-Za-z\\-]+(?:\\.[\\dA-Za-z\\-]+)*))?$'));
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
            it('must point to a valid file', function () {
                expect(json.main).to.equal('index.js');
                expect(fs.existsSync(json.main)).to.be.ok();
            });
        });
    });

    describe('README.md', function () {
        it('must exist', function () {
            expect(fs.existsSync('./README.md')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./README.md').toString()).to.be.ok();
        });
    });

    describe('LICENSE.md', function () {
        it('must exist', function () {
            expect(fs.existsSync('./LICENSE.md')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./LICENSE.md').toString()).to.be.ok();
        });
    });

    describe('.gitignore file', function () {
        it('must exist', function () {
            expect(fs.existsSync('./.gitignore')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./.gitignore').toString()).to.be.ok();
        });
    });

    describe('.npmignore file', function () {
        it('must exist', function () {
            expect(fs.existsSync('./.npmignore')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./.npmignore').toString()).to.be.ok();
        });

        it('must match .gitignore', function () {
            expect(fs.readFileSync('./.npmignore').toString()).to.be(fs.readFileSync('./.gitignore').toString());
        });
    });

    describe('.eslintrc', function () {
        it('must exist', function () {
            expect(fs.existsSync('./.eslintrc')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./.eslintrc').toString()).to.be.ok();
        });
    });

    describe('.nsprc', function () {
        it('must exist', function () {
            expect(fs.existsSync('./.nsprc')).to.be.ok();
        });

        it('must have readable content', function () {
            expect(fs.readFileSync('./.nsprc').toString()).to.be.ok();
        });
    });
});
