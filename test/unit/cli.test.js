var expect = require('expect.js');

/* global describe, it */
describe('cli parser', function () {
    var cli = require('../../bin/newman');

    it('must export a function', function () {
        expect(cli).be.a('function');
    });

    it('should display the current Newman version', function (done) {
        cli(['--version'], 'newmantests', function (err) {
            expect(err).to.be(null);
            done();
        });
    });

    describe('Legacy Arguments', function () {
        it('should load standard arguments (-c and -e)', function (done) {
            cli('-c myCollection.json -e env.json --silent'.split(' '), 'newmantests',
                function (err, config) {
                    expect(err).to.be(null);
                    expect(config.command).to.be('run');
                    expect(config.run).to.be.ok();
                    expect(config.run.collection).to.be('myCollection.json');
                    expect(config.run.environment).to.be('env.json');

                    done();
                });
        });

        it('should support alternative arguments', function (done) {
            cli(('-u http://a.com/myCollection.json ' +
            '--environment-url http://a.com/env.json --silent').split(' '), 'newmantests', function (err, config) {
                expect(err).to.be(null);
                expect(config.command).to.be('run');
                expect(config.run).to.be.ok();
                expect(config.run.collection).to.be('http://a.com/myCollection.json');
                expect(config.run.environment).to.be('http://a.com/env.json');

                expect(config.run.bail).to.be(undefined);
                expect(config.run.suppressExitCode).to.be(undefined);

                done();
            });
        });

        it('should load all arguments', function (done) {
            cli(('-c myCollection.json ' +
            '-e myEnv.json ' +
            '-f myFolder ' +
            '--exportEnvironment exported_env.json ' +
            '-d /path/to/csv.csv ' +
            '-g myGlobals.json ' +
            '-G exported_glob.json ' +
            '--delay 12000 ' +
            '-r 5000 ' +
            '-R ' +
            '-j ' +
            '-n 2000 ' +
            '-C ' +
            '-S ' +
            '-k ' +
            '-l ' +
            '-N binary ' +
            '-o ./omg.txt ' +
            '-O LOTSOFSTUFF.log ' +
            '-t junit.xml ' +
            '-H report.html ' +
            '-W ' +
            '--stopOnError --silent').split(' '), 'newmantests', function (err, config) {
                expect(err).to.be(null);

                var opts = config.run;
                expect(opts).to.be.ok();
                expect(opts.collection).to.be('myCollection.json');
                expect(opts.environment).to.be('myEnv.json');
                expect(opts.folder).to.be('myFolder');
                expect(opts.exportEnvironment).to.be('exported_env.json');
                expect(opts.iterationData).to.be('/path/to/csv.csv');
                expect(opts.globals).to.be('myGlobals.json');
                expect(opts.exportGlobals).to.be('exported_glob.json');
                expect(opts.delayRequest).to.be(12000);
                expect(opts.timeoutRequest).to.be(5000);
                expect(opts.ignoreRedirects).to.be(true);
                expect(opts.insecure).to.be(true);
                expect(opts.noColor).to.be(true);

                expect(opts.reporters).to.contain('json');
                expect(opts.reporters).to.contain('verbose');
                expect(opts.reporters).to.contain('junit');
                expect(opts.reporters).to.contain('html');

                expect(opts.reporter).to.be.ok();
                expect(opts.reporterCliNoSummary).to.be(true);

                // Validate JSON reporter configuration
                expect(opts.reporter.json).to.be.ok();
                expect(opts.reporter.json.output).to.be('./omg.txt');

                // Validate verbose reporter configuration
                expect(opts.reporter.verbose).to.be.ok();
                expect(opts.reporter.verbose.output).to.be('LOTSOFSTUFF.log');

                // Validate junit reporter configuration
                expect(opts.reporter.junit).to.be.ok();
                expect(opts.reporter.junit.output).to.be('junit.xml');

                // Validate HTML reporter configuration
                expect(opts.reporter.html).to.be.ok();
                expect(opts.reporter.html.output).to.be('report.html');

                // Validate HTML reporter configuration
                expect(opts.reporter.html).to.be.ok();
                expect(opts.reporter.html.output).to.be('report.html');

                done();
            });
        });
    });

    describe('Run Command', function () {
        it('should handle standard run command (run collection.json and -e)', function (done) {
            cli('run myCollection.json --environment env.json -n 2'.split(' '), 'newmantests',
                function (err, config) {
                    expect(err).to.be(null);
                    expect(config.command).to.be('run');
                    expect(config.run).to.be.ok();
                    expect(config.run.iterationCount).to.be(2);
                    expect(config.run.collection).to.be('myCollection.json');
                    expect(config.run.environment).to.be('env.json');

                    done();
                });
        });

        it('should throw an error for invalid --iteration-count values', function (done) {
            cli('run myCollection.json -n -3.14'.split(' '), 'newmantests', function (err) {
                expect(err.message).to.be('The value must be a positive integer.');

                done();
            });
        });

        describe('--global-var', function () {
            // test for 'should throw an error for missing --global-var values' has been moved to
            // cli/run-options.test.js since commander throws custom error in case of argument
            //  mismatch and that is better handled through exec and stderr check.
            it('should handle --global-var values without an `=`', function (done) {
                cli('run myCollection.json --global-var foo'.split(' '), 'newmantests', function (err, res) {
                    expect(err).to.be(null);
                    expect(res.run.globalVar).to.eql([
                        { key: 'foo', value: undefined }
                    ]);

                    done();
                });
            });
        });

        it('should load all arguments (except reporters)', function (done) {
            cli(('run ' +
            'myCollection.json ' +
            '-e myEnv.json ' +
            '-g myGlobals.json ' +
            '-d path/to/csv.csv ' +
            '--folder myFolder ' +
            '--export-environment exported_env.json ' +
            '--export-globals exported_glob.json ' +
            '--reporter-cli-no-summary ' +
            '--iteration-count 23 ' +
            '--reporters json,html ' +
            '--global-var foo=bar --global-var alpha==beta= ' +
            '--no-color ' +
            '--delay-request 12000 ' +
            '--timeout 10000 ' +
            '--timeout-request 5000 ' +
            '--timeout-script 5000 ' +
            '--ignore-redirects ' +
            '--bail ' +
            '--suppress-exit-code ' +
            '-k').split(' '), 'newmantests', function (err, config) {
                expect(err).to.be(null);

                var opts = config.run;
                expect(opts).to.be.ok();
                expect(opts.collection).to.be('myCollection.json');
                expect(opts.environment).to.be('myEnv.json');
                expect(opts.folder).to.be('myFolder');
                expect(opts.exportEnvironment).to.be('exported_env.json');
                expect(opts.iterationData).to.be('path/to/csv.csv');
                expect(opts.globals).to.be('myGlobals.json');
                expect(opts.exportGlobals).to.be('exported_glob.json');
                expect(opts.delayRequest).to.be(12000);
                expect(opts.timeout).to.be(10000);
                expect(opts.timeoutRequest).to.be(5000);
                expect(opts.timeoutScript).to.be(5000);
                expect(opts.ignoreRedirects).to.be(true);
                expect(opts.insecure).to.be(true);

                expect(opts.color).to.be(false);

                expect(opts.reporters).to.contain('json');
                expect(opts.reporters).to.contain('html');
                expect(opts.reporters).to.not.contain('junit');

                expect(opts.globalVar).to.eql([
                    { key: 'foo', value: 'bar' },
                    { key: 'alpha', value: '=beta=' }
                ]);

                expect(opts.bail).to.be(true);
                expect(opts.suppressExitCode).to.be(true);

                done();
            });
        });

        it('should load all arguments (including reporters)', function (done) {
            cli(('run ' +
            'myCollection.json ' +
            '-e myEnv.json ' +
            '-g myGlobals.json ' +
            '-d /path/to/csv.csv ' +
            '--folder myFolder ' +
            '--disable-unicode ' +
            '--export-environment exported_env.json ' +
            '--export-globals exported_glob.json ' +
            '--reporter-cli-no-summary ' +
            '--reporter-cli-no-success-assertions ' +
            '--iteration-count 23 ' +
            '--reporters json,html ' +
            '--no-color ' +
            '--delay-request 12000 ' +
            '--timeout 10000 ' +
            '--timeout-request 5000 ' +
            '--timeout-script 5000 ' +
            '--ignore-redirects ' +
            '-k ' +
            '--bail folder,failure ' +
            '--global-var foo=bar --global-var alpha==beta= ' +
            '--reporter-json-output ./omg.txt ' +
            '--reporter-html-output report.html ' +
            '--reporter-html-template ./mytemplate.html ' +
            '--reporter-use everything').split(' '), 'newmantests', function (err, config) {
                expect(err).to.be(null);

                var opts = config.run;
                expect(opts).to.be.ok();
                expect(opts.collection).to.be('myCollection.json');
                expect(opts.environment).to.be('myEnv.json');
                expect(opts.folder).to.be('myFolder');
                expect(opts.disableUnicode).to.be(true);

                expect(opts.exportEnvironment).to.be('exported_env.json');
                expect(opts.iterationData).to.be('/path/to/csv.csv');
                expect(opts.globals).to.be('myGlobals.json');

                expect(opts.exportGlobals).to.be('exported_glob.json');
                expect(opts.delayRequest).to.be(12000);
                expect(opts.timeout).to.be(10000);
                expect(opts.timeoutRequest).to.be(5000);
                expect(opts.timeoutScript).to.be(5000);
                expect(opts.ignoreRedirects).to.be(true);
                expect(opts.insecure).to.be(true);

                expect(opts.globalVar).to.eql([
                    { key: 'foo', value: 'bar' },
                    { key: 'alpha', value: '=beta=' }
                ]);
                expect(opts.bail).to.eql([
                    'folder',
                    'failure'
                ]);

                expect(opts.color).to.be(false);

                expect(opts.reporters).to.contain('json');
                expect(opts.reporters).to.not.contain('verbose');
                expect(opts.reporters).to.not.contain('junit');
                expect(opts.reporters).to.contain('html');

                // Generic reporter options
                expect(opts.reporterOptions).to.be.ok();
                expect(opts.reporterOptions.use).to.be('everything');
                expect(opts.reporterOptions.cliNoSuccessAssertions).to.be(true);

                // Individual reporter options
                expect(opts.reporter).to.be.ok();

                // Validate JSON reporter configuration
                expect(opts.reporter.json).to.be.ok();
                expect(opts.reporter.json.output).to.be('./omg.txt');
                expect(opts.reporter.json.use).to.be('everything');

                // Validate HTML reporter configuration
                expect(opts.reporter.html).to.be.ok();
                expect(opts.reporter.html.output).to.be('report.html');
                expect(opts.reporter.html.template).to.be('./mytemplate.html');
                expect(opts.reporter.html.use).to.be('everything');

                done();
            });
        });
    });
});
