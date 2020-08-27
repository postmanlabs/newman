const _ = require('lodash'),
    // eslint-disable-next-line security/detect-child-process
    child = require('child_process'),
    sh = require('shelljs'),
    join = require('path').join,
    fs = require('fs'),
    liquidJSON = require('liquid-json'),

    TEST_ALIAS = 'testalias',
    DEFAULT_ALIAS = 'default',
    POSTMAN_API_KEY = 'PMAK-01234567890123456789abcd-012345678901234567890123456789abcd',
    ENCODED_API_KEY = '((Y4`1fC)Xn8LLh5ލgKDc2ަ\tHf4MFsAd`1fC)Xn8LLh5ލgKDc2',
    ENCRYPTED_API_KEY = 'd51557f9fdc44cd954e93caaad92ffeca49d1f9ef1f34e76ff94e38294b6742b1462aed' +
    '07b39f1e66184034fd19ce93a5bd2e2ab2050e28c32803f6d988e83f6c7b60dee29a1cbae5f1d2a881663056c',
    PASSKEY = 'pass123',

    LEFT_ARROW = '\u001b[D',
    RIGHT_ARROW = '\u001b[C',
    DOWN_ARROW = '\u001b[B',

    // prompt messages imported from the module
    INPUT_PROMPTS = {
        userAction: 'Default authentication details already exist.\nChoose an option to continue',
        alias: 'Alias',
        overridePermission: 'The alias already exists.\nDo you want to override it?',
        postmanApiKey: 'Postman API Key',
        encrypted: 'Do you want to have a passkey for authentication?',
        passkey: 'Passkey'
    },

    SUCCESS_MESSAGE = 'API Key added successfully.',
    ABORT_MESSAGE = 'Login aborted.';

describe('Login command', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        configDir = join(outDir, '.postman'),
        rcFile = join(configDir, 'newmanrc'),
        proc,
        stdout,
        stderr,

        spawn = (responses) => {
            let n_responses = 0; // the number of responses fed to the program

            proc = child.spawn('node', ['./bin/newman.js', 'login'], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'] // to enable inter process communication through messages
            });

            proc.stdout.setEncoding('utf-8');
            proc.stderr.setEncoding('utf-8');

            // listen to prompt messages and feed the answers to the queries
            proc.on('message', (prompt) => {
                expect(responses).to.have.property(prompt);
                // '\r' stands for carriage return which indicates that the input is complete
                proc.stdin.write(responses[prompt] + '\r');

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
        },

        testStdoutPrompts = (responses) => {
            _.forIn(responses, (value, key) => {
                expect(stdout, 'should contain the prompt and the user input for ' + key)
                    .to.contain(INPUT_PROMPTS[key]);
            });
        };

    beforeEach(function () {
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
        exec('node ./bin/newman.js login -h', (code, stdout) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.match(/Usage: newman login*/);
            done();
        });
    });

    it('should store the data under `default` alias', function (done) {
        let responses = {
                postmanApiKey: POSTMAN_API_KEY,
                encrypted: ''
            },
            result = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: ENCODED_API_KEY, encrypted: false }
                    ]
                }
            };

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);
            testStdoutPrompts(responses);
            expect(stdout, 'should contain the input for api key').to.contain(POSTMAN_API_KEY);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.deep.equal(result);
                done();
            });
        });
    });

    it('should override the `default` alias if it exists', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false }
                    ]
                }
            },
            responses = {
                userAction: '',
                postmanApiKey: POSTMAN_API_KEY,
                encrypted: RIGHT_ARROW,
                passkey: PASSKEY
            },
            resultantData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: ENCRYPTED_API_KEY, encrypted: true }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);
            testStdoutPrompts(responses);
            expect(stdout, 'should contain the input for api key').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should not contain the input for passkey').not.to.contain(PASSKEY);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(resultantData);
                done();
            });
        });
    });

    it('should create a new alias', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false }
                    ]
                }
            },
            responses = {
                userAction: DOWN_ARROW,
                alias: TEST_ALIAS,
                postmanApiKey: POSTMAN_API_KEY,
                encrypted: ''
            },
            resultantData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false },
                        { alias: TEST_ALIAS, postmanApiKey: ENCODED_API_KEY, encrypted: false }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);
            testStdoutPrompts(responses);
            expect(stdout, 'should contain the input for api key').to.contain(POSTMAN_API_KEY);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(resultantData);
                done();
            });
        });
    });

    it('should override an alias with user consent', function (done) {
        let responses = {
                userAction: DOWN_ARROW,
                alias: TEST_ALIAS,
                overridePermission: '',
                postmanApiKey: POSTMAN_API_KEY,
                encrypted: RIGHT_ARROW,
                passkey: PASSKEY
            },
            initialData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false },
                        { alias: TEST_ALIAS, postmanApiKey: '12345', encrypted: false }
                    ]
                }
            },
            resultantData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false },
                        { alias: TEST_ALIAS, postmanApiKey: ENCRYPTED_API_KEY, encrypted: true }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);
            testStdoutPrompts(responses);
            expect(stdout, 'should contain the input for alias').to.contain(TEST_ALIAS);
            expect(stdout, 'should contain the input for api key').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should not contain the input for passkey').not.to.contain(PASSKEY);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(resultantData);
                done();
            });
        });
    });

    it('should exit if user denies permission to override', function (done) {
        let responses = {
                userAction: DOWN_ARROW,
                alias: TEST_ALIAS,
                overridePermission: LEFT_ARROW
            },
            fileData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT_ALIAS, postmanApiKey: '12345', encrypted: false },
                        { alias: TEST_ALIAS, postmanApiKey: '12345', encrypted: false }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(fileData, null, 2), { mode: 0o600 });

        spawn(responses);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 1').to.equal(1);
            testStdoutPrompts(responses);
            expect(stderr, 'should contain failure message').to.contain(ABORT_MESSAGE);

            done();
        });
    });
});
