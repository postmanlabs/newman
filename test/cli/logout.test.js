/* eslint-disable no-process-env */
const fs = require('fs'),
    // eslint-disable-next-line security/detect-child-process
    child = require('child_process'),
    liquidJSON = require('liquid-json'),
    sh = require('shelljs'),
    join = require('path').join,

    DEFAULT = 'default',
    TEST_ALIAS = 'testalias',

    CARRIAGE_RETURN = '\r',
    LEFT_ARROW = '\u001b[D',

    SUCCESS_MESSAGE = 'API Key deleted successfully.',
    ALIAS_INPUT_PROMPT = 'Select the alias',
    ABORT_MESSAGE = 'Logout aborted.',
    NO_APIKEY_AVAILABLE = 'No API Key available.' +
        '\n   Use the login command to store an API Key.';

describe('Logout command', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        configDir = join(outDir, '.postman'),
        rcFile = join(configDir, 'newmanrc'),
        proc,
        stdout,
        stderr,

        spawn = (responses) => {
            let n_responses = 0; // the number of responses fed to the program

            proc = child.spawn('node', ['./bin/newman.js', 'logout'], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'] // to enable inter process communication through messages
            });

            proc.stdout.setEncoding('utf-8');
            proc.stderr.setEncoding('utf-8');

            // listen to prompt messages and feed the answers to the queries
            proc.on('message', (prompt) => {
                expect(responses).to.have.property(prompt);
                proc.stdin.write(responses[prompt] + CARRIAGE_RETURN);

                n_responses++;

                // if the number of responses fed equals total number of responses specified, end the stream
                // else the program doesn't exit
                if (n_responses === Object.keys(responses).length) { proc.stdin.end(); }
            });

            proc.stdout.on('data', (data) => {
                stdout += data;
            });

            proc.stderr.on('data', (data) => {
                stderr += data;
            });
        };

    beforeEach(function () {
        // clean up `outDir` which will be used to save the config file
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);

        stdout = '';
        stderr = '';
    });

    afterEach(function () {
        // make sure the child-process is terminated
        if (proc) {
            proc.removeAllListeners();
            proc.kill();
        }
        sh.rm('-rf', outDir);
    });

    it('should display help with -h option', function (done) {
        proc = exec('node ./bin/newman.js logout -h', (code, stdout) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.match(/Usage: newman logout*/);
            done();
        });
    });

    it('should log out the alias directly if only one alias exists', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: TEST_ALIAS }
                    ]
                }
            },
            responses = {
                userPermission: ''
            },
            finalData = {
                login: {
                    _profiles: []
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stderr).to.be.empty;
            expect(stdout, 'should contain the confirmation message').to
                .contain('Are you sure you want to delete API Key with alias `testalias`?');
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });
    });

    it('should not log out the alias if user doesn\'t give the confirmation', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: TEST_ALIAS }
                    ]
                }
            },
            responses = {
                userPermission: LEFT_ARROW
            },
            finalData = initialData;

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr).to.contain(ABORT_MESSAGE);
            expect(stdout, 'should contain the confirmation message').to
                .contain('Are you sure you want to delete API Key with alias `testalias`?');

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });
    });

    it('should show all the choices if there are more than one aliases available', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT },
                        { alias: TEST_ALIAS }
                    ]
                }
            },
            responses = {
                alias: DEFAULT,
                userPermission: ''
            },
            finalData = {
                login: {
                    _profiles: [
                        { alias: TEST_ALIAS }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stderr).to.be.empty;
            expect(stdout, 'should contain the prompt for alias input').to.contain(ALIAS_INPUT_PROMPT);
            expect(stdout, 'should contain the chosen option').to.contain(DEFAULT);
            expect(stdout, 'should contain the confirmation message').to
                .contain('Are you sure you want to delete the default API Key?');
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });
    });

    it('should print an error if there are no stored API keys', function (done) {
        proc = exec('node ./bin/newman.js logout', function (code, _stdout, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr, 'should display the error message').to.contain(NO_APIKEY_AVAILABLE);
            done();
        });
    });
});
