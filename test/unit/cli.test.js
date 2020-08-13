/* eslint-disable no-process-env */
describe('cli parser', function () {
    var _ = require('lodash'),
        sinon = require('sinon'),
        fs = require('fs'),
        join = require('path').join,
        newman = require('../../'),
        newmanCLI,

        /**
         * Wrap newmanCLI callback to extract options passed to sinon `newman` stub.
         *
         * @param {String[]} argv - Argument vector.
         * @param {String} command - Newman command name, used for `sinon` result lookup.
         * @param {Function} callback - The callback function invoked on the completion of commander parsing.
         */
        cli = (argv, command, callback) => {
            newmanCLI(argv, (err) => {
                callback(err, _.get(newman, [command, 'lastCall', 'returnValue']));
            });
        };

    beforeEach(function () {
        // delete require cache to use program instance for consecutive runs.
        delete require.cache[require.resolve('../../bin/newman')];
        newmanCLI = require('../../bin/newman');
    });

    describe('Run Command', function () {
        let outDir = join(__dirname, '..', '..', 'out'),
            homeRCFile = join(outDir, '.postman', 'newmanrc'),
            processEnv = process.env;

        // stub `newman.run`, directly return options passed to `newman.run` in newmanCLI.
        before(function () {
            sinon.stub(newman, 'run').callsFake((options) => {
                return options;
            });
        });

        // restore original `newman.run` function.
        after(function () {
            newman.run.restore();
        });

        beforeEach(function () {
            // clear all the env variables related to newman to avoid passing default options from it
            process.env = _.omitBy(process.env, (_value, key) => {
                return (key.startsWith('POSTMAN_') || key.startsWith('NEWMAN_')) && key !== 'NEWMAN_TEST_ENV';
            });

            // stub `fs.readfile` to ignore file-read errors
            sinon.stub(fs, 'readFile').callsFake((_file, cb) => {
                return cb(null, Buffer.from('{}', 'utf-8'));
            });
        });

        afterEach(function () {
            process.env = processEnv; // restore the process-env
            fs.readFile.restore(); // restore original `fs.readfile`
        });

        it('should pass default options correctly', function (done) {
            cli('node newman.js run collection.json'.split(' '), 'run',
                function (err, opts) {
                    expect(err).to.be.null;

                    // explicitly match object to track addition/deletion of properties.
                    expect(opts).to.eql({
                        args: ['collection.json'],
                        rawArgs: null,
                        collection: 'collection.json',
                        reporters: ['cli'],
                        delayRequest: 0,
                        globalVar: [],
                        envVar: [],
                        folder: [],
                        insecureFileRead: true,
                        color: 'auto',
                        timeout: 0,
                        timeoutRequest: 0,
                        timeoutScript: 0,
                        reporterOptions: {},
                        reporter: { cli: {} }
                    });

                    done();
                });
        });

        it('should handle standard run command (run collection.json and -e)', function (done) {
            cli('node newman.js run myCollection.json --environment env.json -n 2'.split(' '), 'run',
                function (err, opts) {
                    expect(err).to.be.null;
                    expect(opts).to.be.ok;
                    expect(opts.iterationCount, 'should have iterationCount of 2').to.equal(2);
                    expect(opts.collection).to.equal('myCollection.json');
                    expect(opts.environment).to.equal('env.json');

                    done();
                });
        });

        it('should throw an error for invalid --iteration-count values', function (done) {
            cli('node newman.js run myCollection.json -n -3.14'.split(' '), 'run', function (err) {
                expect(err).to.have.property('message', 'The value must be a positive integer.');

                done();
            });
        });

        describe('--global-var', function () {
            // test for 'should throw an error for missing --global-var values' has been moved to
            // cli/run-options.test.js since commander throws custom error in case of argument
            //  mismatch and that is better handled through exec and stderr check.
            it('should handle --global-var values without an `=`', function (done) {
                cli('node newman.js run myCollection.json --global-var foo'.split(' '), 'run', function (err, opts) {
                    expect(err).to.be.null;
                    expect(opts.globalVar).to.eql([
                        { key: 'foo', value: undefined }
                    ]);

                    done();
                });
            });
        });

        describe('--color', function () {
            it('should have color `auto` by default', function (done) {
                cli('node newman.js run myCollection.json'.split(' '), 'run',
                    function (err, opts) {
                        expect(err).to.be.null;
                        expect(opts.color).to.equal('auto');
                        done();
                    });
            });

            it('should have color enabled with `--color on`', function (done) {
                cli('node newman.js run myCollection.json --color on'.split(' '), 'run',
                    function (err, opts) {
                        expect(err).to.be.null;
                        expect(opts.color).to.equal('on');
                        done();
                    });
            });

            it('should have color disabled with `--color off`', function (done) {
                cli('node newman.js run myCollection.json --color off'.split(' '), 'run',
                    function (err, opts) {
                        expect(err).to.be.null;
                        expect(opts.color).to.equal('off');
                        done();
                    });
            });

            it('should throw an error for invalid --color values', function (done) {
                cli('node newman.js run myCollection.json --color --disable-unicode'.split(' '), 'run', function (err) {
                    expect(err).to.have.property('message',
                        'invalid value `--disable-unicode` for --color. Expected: auto|on|off');

                    done();
                });
            });
        });

        it('should load all arguments (except reporters)', function (done) {
            cli(('node newman.js run ' +
                'myCollection.json ' +
                '-e myEnv.json ' +
                '-g myGlobals.json ' +
                '-d path/to/csv.csv ' +
                '--folder myFolder ' +
                '--working-dir /Users/postman ' +
                '--no-insecure-file-read ' +
                '--export-environment exported_env.json ' +
                '--export-globals exported_glob.json ' +
                '--postman-api-key POSTMAN_API_KEY ' +
                '--postman-api-key-alias testalias ' +
                '--reporter-cli-no-summary ' +
                '--iteration-count 23 ' +
                '--reporters json ' +
                '--global-var foo=bar --global-var alpha==beta= ' +
                '--color off ' +
                '--delay-request 12000 ' +
                '--timeout 10000 ' +
                '--timeout-request 5000 ' +
                '--timeout-script 5000 ' +
                '--ignore-redirects ' +
                '--bail ' +
                '--suppress-exit-code ' +
                '-k ' +
                '--verbose').split(' '), 'run', function (err, opts) {
                expect(err).to.be.null;

                expect(opts).to.be.ok;
                expect(opts.collection).to.equal('myCollection.json');
                expect(opts.environment).to.equal('myEnv.json');
                expect(opts.folder).to.eql(['myFolder']);
                expect(opts.workingDir).to.eql('/Users/postman');
                expect(opts.insecureFileRead).to.be.false;
                expect(opts.exportEnvironment).to.equal('exported_env.json');
                expect(opts.iterationData).to.equal('path/to/csv.csv');
                expect(opts.globals).to.equal('myGlobals.json');
                expect(opts.exportGlobals).to.equal('exported_glob.json');
                expect(opts.postmanApiKey).to.equal('POSTMAN_API_KEY');
                expect(opts, 'should not pass api-key-alias option').to.not.have.property('postmanApiKeyAlias');
                expect(opts.delayRequest, 'should have delayRequest of 12000').to.equal(12000);
                expect(opts.timeout, 'should have timeout of 10000').to.equal(10000);
                expect(opts.timeoutRequest, 'should have timeoutRequest of 5000').to.equal(5000);
                expect(opts.timeoutScript, 'should have timeoutScript of 5000').to.equal(5000);
                expect(opts.ignoreRedirects, 'should have ignoreRedirects to be true').to.equal(true);
                expect(opts.insecure, 'shoudl have insecure to be true').to.equal(true);

                expect(opts.color).to.equal('off');

                expect(opts.reporters).to.contain('json');
                expect(opts.reporters).to.not.contain('junit');

                expect(opts.globalVar).to.eql([
                    { key: 'foo', value: 'bar' },
                    { key: 'alpha', value: '=beta=' }
                ]);

                expect(opts.bail, 'should have bail to be true').to.equal(true);
                expect(opts.suppressExitCode, 'should have suppressExitCode to be true').to.equal(true);
                expect(opts.verbose, 'should have verbose to be true').to.equal(true);

                done();
            });
        });

        it('should load all arguments (including reporters)', function (done) {
            cli(('node newman.js run ' +
                'myCollection.json ' +
                '-e myEnv.json ' +
                '-g myGlobals.json ' +
                '-d /path/to/csv.csv ' +
                '--folder myFolder1 ' +
                '--folder myFolder2 ' +
                '--working-dir /Users/postman ' +
                '--no-insecure-file-read ' +
                '--disable-unicode ' +
                '--export-environment exported_env.json ' +
                '--export-globals exported_glob.json ' +
                '--reporter-cli-no-summary ' +
                '--reporter-cli-no-success-assertions ' +
                '--iteration-count 23 ' +
                '--reporters json ' +
                '--color on ' +
                '--delay-request 12000 ' +
                '--timeout 10000 ' +
                '--timeout-request 5000 ' +
                '--timeout-script 5000 ' +
                '--ignore-redirects ' +
                '-k ' +
                '--verbose ' +
                '--bail folder,failure ' +
                '--global-var foo=bar --global-var alpha==beta= ' +
                '--reporter-json-output ./omg.txt ' +
                '--reporter-use everything').split(' '), 'run', function (err, opts) {
                expect(err).to.be.null;

                expect(opts).to.be.ok;
                expect(opts.collection).to.equal('myCollection.json');
                expect(opts.environment).to.equal('myEnv.json');
                expect(opts.folder).to.eql(['myFolder1', 'myFolder2']);
                expect(opts.workingDir).to.eql('/Users/postman');
                expect(opts.insecureFileRead).to.be.false;
                expect(opts.disableUnicode, 'should have disableUnicode to be true').to.equal(true);

                expect(opts.exportEnvironment).to.equal('exported_env.json');
                expect(opts.iterationData).to.equal('/path/to/csv.csv');
                expect(opts.globals).to.equal('myGlobals.json');

                expect(opts.exportGlobals).to.equal('exported_glob.json');
                expect(opts.delayRequest, 'should have delayRequest of 12000').to.equal(12000);
                expect(opts.timeout, 'should have timeout of 10000').to.equal(10000);
                expect(opts.timeoutRequest, 'should have timeoutRequest of 5000').to.equal(5000);
                expect(opts.timeoutScript, 'should have timeoutScript of 5000').to.equal(5000);
                expect(opts.ignoreRedirects, 'should have ignoreRedirects to be true').to.equal(true);
                expect(opts.insecure, 'should have insecure to be true').to.equal(true);
                expect(opts.verbose, 'should have verbose to be true').to.equal(true);

                expect(opts.globalVar).to.eql([
                    { key: 'foo', value: 'bar' },
                    { key: 'alpha', value: '=beta=' }
                ]);
                expect(opts.bail).to.eql([
                    'folder',
                    'failure'
                ]);

                expect(opts.color).to.equal('on');

                expect(opts.reporters).to.contain('json');
                expect(opts.reporters).to.not.contain('verbose');
                expect(opts.reporters).to.not.contain('junit');

                // Generic reporter options
                expect(opts.reporterOptions).to.be.ok;
                expect(opts.reporterOptions.use).to.equal('everything');
                expect(opts.reporterOptions.cliNoSuccessAssertions
                    , 'should have cliNoSuccessAssertions to be true').to.equal(true);

                // Individual reporter options
                expect(opts.reporter).to.be.ok;

                // Validate JSON reporter configuration
                expect(opts.reporter.json).to.be.ok;
                expect(opts.reporter.json.output).to.equal('./omg.txt');
                expect(opts.reporter.json.use).to.equal('everything');

                done();
            });
        });

        it('should turn off newman banner if --reporter-cli-no-banner is set', function (done) {
            cli('node newman.js run myCollection.json --reporter-cli-no-banner'.split(' '), 'run',
                function (err, opts) {
                    expect(err).to.be.null;
                    expect(opts).to.be.ok;
                    expect(opts.reporter.cli.noBanner, 'should have noBanner to be true').to.equal(true);

                    done();
                });
        });

        it('should load config settings from rc-file', function (done) {
            let fileData = {
                run: {
                    reporters: ['cli', 'json'],
                    environment: 'test-env',
                    folder: ['folder1', 'folder2'],
                    iterationCount: 5,
                    envVar: [{ key: 'envVar1', value: '5' }],
                    color: 'on'
                }
            };

            fs.readFile.restore();
            sinon.stub(fs, 'readFile').callsFake((file, cb) => {
                if (file === homeRCFile) { return cb(null, Buffer.from(JSON.stringify(fileData), 'utf8')); }

                return cb(null, Buffer.from('{}', 'utf-8'));
            });

            cli('node newman.js run myCollection.json'.split(' '), 'run', function (err, opts) {
                expect(err).to.be.null;
                expect(opts).to.be.ok;

                _.forIn(fileData.run, (value, key) => {
                    expect(opts[key]).to.eql(value);
                });

                done();
            });
        });

        it('should load config settings from process-env', function (done) {
            process.env.POSTMAN_API_KEY = '123';

            cli('node newman.js run myCollection.json'.split(' '), 'run', function (err, opts) {
                expect(err).to.be.null;
                expect(opts).to.be.ok;

                expect(opts.postmanApiKey).to.equal('123');

                done();
            });
        });

        it('should merge options from all sources', function (done) {
            let fileData = {
                run: {
                    reporters: ['cli', 'json'],
                    environment: 'test-env',
                    folder: ['folder1', 'folder2'],
                    iterationCount: 5,
                    envVar: [{ key: 'envVar1', value: '5' }],
                    postmanApiKeyAlias: 'POSTMAN_API_KEY_ALIAS'
                },

                login: {
                    _profiles: [
                        { alias: 'TEST_ALIAS', postmanApiKey: '1234' }
                    ]
                }
            };

            fs.readFile.restore();
            sinon.stub(fs, 'readFile').callsFake((file, cb) => {
                if (file === homeRCFile) { return cb(null, Buffer.from(JSON.stringify(fileData), 'utf8')); }

                return cb(null, Buffer.from('{}', 'utf-8'));
            });

            process.env.POSTMAN_API_KEY_ALIAS = 'TEST_ALIAS';

            cli(('node newman.js run myCollection.json -g abc -r cli -e env-test --env-var foo=bar -n 6').split(' '),
                'run', function (err, opts) {
                    expect(err).to.be.null;
                    expect(opts).to.be.ok;

                    expect(opts.reporters).to.eql(['cli']);
                    expect(opts.environment).to.eql('env-test');
                    expect(opts.folder).to.eql(['folder1', 'folder2']);
                    expect(opts.iterationCount).to.eql(6);
                    expect(opts.envVar).to.be.ok;
                    expect(opts.envVar).to.eql([{ key: 'foo', value: 'bar' }]);
                    expect(opts.globals).to.eql('abc');
                    expect(opts.postmanApiKey, 'should contain details of the alias indicated in process-env')
                        .to.eql({ alias: 'TEST_ALIAS', postmanApiKey: '1234' });

                    done();
                });
        });
    });

    describe('Login command', function () {
        let spy;

        before(function () {
            // create a new spy
            spy = sinon.spy();

            // replace the function to be exported from the login module with the spy
            require.cache[require.resolve('../../lib/login')] = {
                exports: spy
            };
        });

        after(function () {
            // restore original `login` module.
            delete require.cache[require.resolve('../../lib/login')];
        });

        it('should invoke the login function', function (done) {
            cli('node newman.js login'.split(' '), 'login', function (err) {
                expect(err).to.be.null;
                expect(spy.calledOnce).to.be.true;
                done();
            });
        });
    });

    describe('Logout command', function () {
        let spy;

        before(function () {
            // create a new spy
            spy = sinon.spy();

            // replace the function to be exported from the logout module with the spy
            require.cache[require.resolve('../../lib/logout')] = {
                exports: spy
            };
        });

        after(function () {
            // restore original `logout` module.
            delete require.cache[require.resolve('../../lib/logout')];
        });

        it('should invoke the logout function', function (done) {
            cli('node newman.js logout'.split(' '), 'logout', function (err) {
                expect(err).to.be.null;
                expect(spy.calledOnce).to.be.true;
                done();
            });
        });
    });
});
