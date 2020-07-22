/* eslint-disable no-process-env */
const fs = require('fs'),
    liquidJSON = require('liquid-json'),
    sh = require('shelljs'),
    join = require('path').join,

    DEFAULT = 'default',
    TEST_ALIAS = 'testalias',

    DOWN_ARROW = '\u001b[B',
    CARRIAGE_RETURN = '\r',

    ALIAS_INPUT_PROMPT = 'Select the alias',
    SUCCESS_MESSAGE = (alias) => { return `${alias} logged out successfully.`; },
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
                        { alias: DEFAULT },
                        { alias: TEST_ALIAS }
                    ]
                }
            },
            finalData = {
                login: {
                    _profiles: [
                        { alias: DEFAULT }
                    ]
                }
            };

        fs.mkdirSync(configDir);
        fs.writeFileSync(rcFile, JSON.stringify(initialData, null, 2), { mode: 0o600 });

        proc = exec('node ./bin/newman.js logout', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stderr).to.be.empty;
            expect(stdout, 'should contain the prompt for alias input').to.contain(ALIAS_INPUT_PROMPT);
            expect(stdout, 'should highlight the chosen option').to.contain(TEST_ALIAS);
            expect(stdout, 'should not include \'default\' alias').to.contain(DEFAULT);
            expect(stdout, 'should contain the success message').to.contain(SUCCESS_MESSAGE(TEST_ALIAS));

            fs.readFile(rcFile, (err, data) => {
                expect(err).to.be.null;
                data = liquidJSON.parse(data.toString());
                expect(data).to.eql(finalData);
                done();
            });
        });

        // go to the next option and press enter
        proc.stdin.write(DOWN_ARROW + CARRIAGE_RETURN);
        proc.stdin.end();
    });

    it('should print an error if no aliases exist', function (done) {
        proc = exec('node ./bin/newman.js logout', function (code, _stdout, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr, 'should display the error message').to.contain(NO_ALIAS_AVAILABLE);
            done();
        });
    });
});
