/* eslint-disable no-process-env */
const fs = require('fs'),
    // eslint-disable-next-line security/detect-child-process
    child = require('child_process'),
    liquidJSON = require('liquid-json'),
    sh = require('shelljs'),
    join = require('path').join,
    colors = require('colors/safe'),

    DEFAULT = 'default',
    TEST_ALIAS = 'testalias',

    DOWN_ARROW = '\u001b[B',
    CARRIAGE_RETURN = '\r',

    ALIAS_INPUT_PROMPT = 'Select the alias',
    SUCCESS_MESSAGE = (alias) => { return `${alias} logged out successfully.`; },
    ALIAS_OPTION = (alias) => { return `   ${alias}`; },
    HIGHLIGHTED_ALIAS_OPTION = (alias) => { return ' * ' + colors.green(alias); },
    NO_ALIAS_AVAILABLE = 'No aliases are available.';

describe('Logout command', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        configDir = join(outDir, '.postman'),
        rcFile = join(configDir, 'newmanrc'),
        isWin = (/^win/).test(process.platform),
        homeDir = process.env[isWin ? 'userprofile' : 'HOME'],
        proc;

    before(function () {
        // change the home directory to alter the location of the rc file
        process.env[isWin ? 'userprofile' : 'HOME'] = outDir;
    });

    after(function () {
        // update the home directory back to its original value
        process.env[isWin ? 'userprofile' : 'HOME'] = homeDir;
    });

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
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
            finalData = {
                login: {
                    _profiles: []
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        proc = exec('node ./bin/newman.js logout', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should indicate the deleted alias').to.contain(SUCCESS_MESSAGE(TEST_ALIAS));
            expect(stderr).to.be.empty;

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });
    });

    it('should show all the choices if there are more than one available', function (done) {
        let initialData = {
                login: {
                    _profiles: [
                        { alias: TEST_ALIAS },
                        { alias: DEFAULT }
                    ]
                }
            },
            finalData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT }
                    ]
                }
            },
            stdout = '';

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        proc = child.spawn('node', ['./bin/newman.js', 'logout'], {
            stdio: ['pipe', 'pipe', 'pipe', 'ipc'] // to enable inter process communication through messages
        });

        proc.stdout.on('data', (data) => {
            stdout += data;
        });

        // navigate between the options and choose the required alias when prompted for
        proc.on('message', () => {
            expect(stdout, 'should contain the prompt for alias input').to.contain(ALIAS_INPUT_PROMPT);
            expect(stdout, 'should highlight the current option').to.contain(HIGHLIGHTED_ALIAS_OPTION(DEFAULT));
            expect(stdout, 'should include \'testalias\' in the list of options').to.contain(ALIAS_OPTION(TEST_ALIAS));

            // go to the next option and press enter
            proc.stdin.write(DOWN_ARROW + CARRIAGE_RETURN);
            proc.stdin.end();
        });

        proc.on('close', (code) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should contain the prompt for alias input').to.contain(ALIAS_INPUT_PROMPT);
            expect(stdout, 'should highlight the chosen option').to.contain(HIGHLIGHTED_ALIAS_OPTION(TEST_ALIAS));
            expect(stdout, 'should not highlight the previous option').to.contain(HIGHLIGHTED_ALIAS_OPTION(DEFAULT));
            expect(stdout, 'should include \'default\' in the list of options').to.contain(ALIAS_OPTION(DEFAULT));
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE(TEST_ALIAS));

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });
    });

    it('should print an error if no aliases exist', function (done) {
        proc = exec('node ./bin/newman.js logout', function (code, _stdout, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr, 'should display the error message').to.contain(NO_ALIAS_AVAILABLE);
            done();
        });
    });
});
