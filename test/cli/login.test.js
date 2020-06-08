/* eslint-disable no-process-env */
// eslint-disable-next-line security/detect-child-process
const child = require('child_process'),
    sh = require('shelljs'),
    join = require('path').join,
    fs = require('fs'),
    liquidJSON = require('liquid-json'),

    SUCCESS_MESSAGE = 'User added successfully.',
    FAILURE_MESSAGE = 'Operation unsuccessful',

    // '\r' stands for carriage return which tells the process the input is complete
    ALIAS = 'user1',
    POSTMAN_API_KEY = '123456&\r',
    ENCODED_API_KEY = '\u0018LF3!TlҀ',
    PASSKEY = 'pass123\r',
    ENCRYPTED_API_KEY = 'ef7a3b7ca332e8b08a7ec853f7243fdd',
    DEFAULT = 'default',

    USER_OVERRIDE_WARNING = 'The user already exists.\nDo you want to override it (Y/N): ',
    API_KEY_INPUT_PROMPT = 'Enter the Postman API Key of the user: ',
    PASSKEY_INPUT_PROMPT = 'Enter the passkey: ';

describe('Newman login', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        rcFile = join(outDir, '.postman', 'newmanrc'),
        isWin = (/^win/).test(process.platform),
        homeDir = process.env[isWin ? 'userprofile' : 'HOME'],
        stdout,
        stderr,

        spawn = (args, responses) => {
            let proc = child.spawn('node', ['./bin/newman.js', ...args], {
                stdio: ['pipe', 'pipe', 'pipe', 'ipc'] // to enable inter process communication through messages
            });

            proc.stdout.setEncoding('utf-8');
            proc.stderr.setEncoding('utf-8');

            // listen to prompt messages and feed the answers to the queries
            proc.on('message', (prompt) => {
                expect(responses).to.have.property(prompt);
                proc.stdin.write(responses[prompt]);
            });

            proc.stdout.on('data', (data) => {
                stdout += data;
            });

            proc.stderr.on('data', (data) => {
                stderr += data;
            });

            return proc;
        };

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
        // change the home directory to alter the location of the rc file
        process.env[isWin ? 'userprofile' : 'HOME'] = outDir;
        stdout = '';
        stderr = '';
    });


    afterEach(function () {
        sh.rm('-rf', outDir);
        // update the home directory back to its original value
        process.env[isWin ? 'userprofile' : 'HOME'] = homeDir;
    });

    it('should display help with -h option', function (done) {
        let proc = spawn(['login', '-h']);

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout).to.match(/Usage: newman login*/);
            done();
        });
    });

    it('should work with an alias', function (done) {
        let proc = spawn(['login', ALIAS], {
            postmanApiKey: POSTMAN_API_KEY
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should prompt the user for API Key').to.contain(API_KEY_INPUT_PROMPT);
            expect(stdout, 'should contain the API Key provided').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.not.be.ok;
                data = liquidJSON.parse(data.toString().trim());
                expect(data).to.have.property('login');
                expect(data.login).to.have.property('_profiles');
                expect(data.login._profiles).to.eql([
                    { alias: ALIAS, postmanApiKey: ENCODED_API_KEY }
                ]);
                done();
            });
        });
    });

    it('should work without an alias', function (done) {
        let proc = spawn(['login'], {
            postmanApiKey: POSTMAN_API_KEY
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should prompt the user for API Key').to.contain(API_KEY_INPUT_PROMPT);
            expect(stdout, 'should contain the API Key provided').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.not.be.ok;
                data = liquidJSON.parse(data.toString().trim());
                expect(data).to.have.property('login');
                expect(data.login).to.have.property('_profiles');
                expect(data.login._profiles).to.eql([
                    { alias: DEFAULT, postmanApiKey: ENCODED_API_KEY }
                ]);
                done();
            });
        });
    });

    it('should work with -p option', function (done) {
        let proc = spawn(['login', '-p'], {
            postmanApiKey: POSTMAN_API_KEY,
            passkey: PASSKEY
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should prompt the user for API Key').to.contain(API_KEY_INPUT_PROMPT);
            expect(stdout, 'should contain the API Key provided').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should prompt the user for passkey').to.contain(PASSKEY_INPUT_PROMPT);
            expect(stdout, 'should not contain the passkey provided').not.to.contain(PASSKEY);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.not.be.ok;
                data = liquidJSON.parse(data.toString().trim());
                expect(data).to.have.property('login');
                expect(data.login).to.have.property('_profiles');
                expect(data.login._profiles).to.eql([
                    { alias: DEFAULT, postmanApiKey: ENCRYPTED_API_KEY, encrypted: true }
                ]);
                done();
            });
        });
    });

    it('should work if user already exists', function (done) {
        let fileData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT, postmanApiKey: '12345' }
                    ]
                }
            },
            proc;

        // store the data containing 'default' alias before executing the command
        sh.mkdir('-p', join(outDir, '.postman'));
        sh.touch(rcFile) && sh.chmod(600, rcFile);
        fs.writeFile(rcFile, JSON.stringify(fileData, null, 2), (err) => {
            if (err) { return done(err); }
        });

        proc = spawn(['login'], {
            overridePermission: 'y\r',
            postmanApiKey: POSTMAN_API_KEY
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should take the user permission to override the data')
                .to.contain(USER_OVERRIDE_WARNING);
            expect(stdout, 'should prompt the user for API Key').to.contain(API_KEY_INPUT_PROMPT);
            expect(stdout, 'should contain the API Key provided').to.contain(POSTMAN_API_KEY);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE);

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.not.be.ok;
                data = liquidJSON.parse(data.toString().trim());
                expect(data).to.have.property('login');
                expect(data.login).to.have.property('_profiles');
                expect(data.login._profiles).to.eql([
                    { alias: DEFAULT, postmanApiKey: ENCODED_API_KEY }
                ]);
                done();
            });
        });
    });

    it('should exit if user denies permission to override', function (done) {
        let fileData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT, postmanApiKey: '12345' }
                    ]
                }
            },
            proc;

        sh.mkdir('-p', join(outDir, '.postman'));
        sh.touch(rcFile) && sh.chmod(600, rcFile);
        fs.writeFile(rcFile, JSON.stringify(fileData, null, 2), (err) => {
            if (err) { return done(err); }
        });

        proc = spawn(['login'], {
            overridePermission: 'n\r'
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr, 'should contain failure message').to.contain(FAILURE_MESSAGE);
            done();
        });
    });
});
