/* eslint-disable no-process-env */

let sh = require('shelljs'),
    _ = require('lodash'),
    join = require('path').join,
    fs = require('fs'),
    http = require('http'),
    enableServerDestroy = require('server-destroy'),

    TEST_ALIAS = 'testalias',
    DEFAULT_ALIAS = 'default',
    PASSKEY_PROMPT = 'Passkey',
    PASSKEY = 'pass123',

    HOME_RC_DATA = {
        login: {
            _profiles: [
                {
                    alias: TEST_ALIAS,
                    postmanApiKey: '\u0019M\u0006S0', // decoded = 3456
                    encrypted: false
                },
                {
                    alias: DEFAULT_ALIAS,
                    postmanApiKey: 'd4747d8671b0eb2dcb1e8868f478bb6b', // decypted = 12, passkey=pass123
                    encrypted: true
                }
            ]
        }
    },
    CWD_RC_DATA = {
        login: {
            _profiles: [
                {
                    alias: TEST_ALIAS,
                    postmanApiKey: '\u001bN\u0007\u0010', // decoded = 789
                    encrypted: false
                },
                {
                    alias: DEFAULT_ALIAS,
                    postmanApiKey: '\u001aލަ`', // decoded = 456
                    encrypted: false
                }
            ]
        }
    },
    RC_FILE_MODE = 0o600,
    RC_DIR_MODE = 0o700,

    API_SERVER_HOST = 4003,
    // the prefix 'http' is required, else the program assumes it to be a file
    COLLECTION_API_URL = `http://localhost:${API_SERVER_HOST}/collections`,
    ENVIRONMENT_API_URL = `http://localhost:${API_SERVER_HOST}/environments`,
    API_KEY_HEADER = 'x-api-key',

    TEST_COLLECTION = 'test collection',
    TEST_ENVIRONMENT = 'test environment',
    RESPONSES = {
        collections: {
            collection: {
                info: {
                    name: TEST_COLLECTION
                }
            }
        },
        environments: {
            environment: {
                info: {
                    name: TEST_ENVIRONMENT
                }
            }
        }
    };

describe('postman-api-key-alias option and environment variable', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        configDir = join(outDir, '.postman'),
        homeRCFile = join(configDir, 'newmanrc'),
        cwdRCFile = join(outDir, '.newmanrc'),
        processEnv = process.env,
        currentWorkingDir = process.cwd(),
        currentApiKey,
        proc,

        // create a server to respond with status 200 only if the API-Key passed is the required one
        apiServer = (function () {
            var server;

            server = http.createServer((req, res) => {
                if (parseInt(req.headers[API_KEY_HEADER], 10) !== currentApiKey) {
                    return res.writeHead(401).end(); // Unauthorized
                }

                let resource = req.url.substr(req.url.lastIndexOf('/') + 1);

                res.writeHead(200).end(JSON.stringify(RESPONSES[resource]));
            });

            server.on('listening', function () {
                server.port = this.address().port;
            });

            enableServerDestroy(server);

            return server;
        }());

    before(function () {
        !fs.existsSync(outDir) && fs.mkdirSync(outDir);

        // clear all the env variables related to newman
        process.env = _.omitBy(process.env, (_value, key) => {
            return (key.startsWith('POSTMAN_') || key.startsWith('NEWMAN_')) && key !== 'NEWMAN_TEST_ENV';
        });

        apiServer.listen(API_SERVER_HOST, (err) => {
            if (err) { throw err; }
        });
    });

    after(function () {
        // restore the process-env
        process.env = processEnv;
        apiServer.destroy();
    });

    beforeEach(function () {
        fs.existsSync(outDir) && sh.rm('-rf', outDir);
        fs.mkdirSync(outDir);
        process.chdir(outDir); // for cwd-rc-file
        fs.mkdirSync(configDir, { mode: RC_DIR_MODE });
    });

    afterEach(function () {
        process.chdir(currentWorkingDir);
        // make sure the child-process is terminated
        if (proc) {
            proc.removeAllListeners();
            proc.kill();
        }
        sh.rm('-rf', outDir);
    });

    it('should get the alias from the postman-api-key-alias option', function (done) {
        fs.writeFileSync(homeRCFile, JSON.stringify(HOME_RC_DATA, null, 2), { mode: RC_FILE_MODE });
        currentApiKey = 3456;

        proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL} --postman-api-key-alias=${TEST_ALIAS}`,
            (code, stdout, stderr) => {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout, 'should indicate the alias used').to.contain(TEST_ALIAS);
                expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
                done();
            });
    });

    it('should get the alias from POSTMAN_API_KEY_ALIAS environment variable', function (done) {
        fs.writeFileSync(cwdRCFile, JSON.stringify(CWD_RC_DATA, null, 2), { mode: RC_FILE_MODE });
        currentApiKey = 789;

        proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL} -e ${ENVIRONMENT_API_URL} `,
            { env: { ...process.env, POSTMAN_API_KEY_ALIAS: TEST_ALIAS } },
            (code, stdout, stderr) => {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect((stdout.match(/testalias/g) || []).length, 'should indicate the alias only once').to.equal(1);
                expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
                done();
            });
    });

    it('should prompt for a passkey if the API Key is encrypted', function (done) {
        fs.writeFileSync(homeRCFile, JSON.stringify(HOME_RC_DATA, null, 2), { mode: RC_FILE_MODE });
        currentApiKey = 12;

        proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL} -e ${ENVIRONMENT_API_URL}`,
            (code, stdout, stderr) => {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect((stdout.match(/Authenticating using stored API Key/g) || []).length,
                    'should indicate the API Key used').to.equal(1);
                expect(stdout, 'should prompt for the passkey').to.contain(PASSKEY_PROMPT);
                expect(stdout, 'should not include the passkey provided').to.not.contain(PASSKEY);
                expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
                done();
            });

        // write the passkey to the stdin as soon as the program begins
        proc.stdin.write(PASSKEY + '\r');
        proc.stdin.end(); // else the program keeps listening to it
    });

    it('should prefer the option over the environment variable', function (done) {
        fs.writeFileSync(homeRCFile, JSON.stringify(HOME_RC_DATA, null, 2), { mode: RC_FILE_MODE });
        currentApiKey = 3456;

        proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL} --postman-api-key-alias=${TEST_ALIAS}`,
            { env: { ...process.env, POSTMAN_API_KEY_ALIAS: DEFAULT_ALIAS } },
            (code, stdout, stderr) => {
                expect(code, 'should have exit code of 0').to.equal(0);
                expect(stderr).to.be.empty;
                expect(stdout, 'should indicate the alias used').to.contain(TEST_ALIAS);
                expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
                done();
            });
    });

    it('should prefer API-Key option over API-Key-Alias if both are available', function (done) {
        fs.writeFileSync(homeRCFile, JSON.stringify(HOME_RC_DATA, null, 2), { mode: RC_FILE_MODE });
        currentApiKey = 1234;

        proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL} --postman-api-key-alias=${TEST_ALIAS}\
         --postman-api-key=1234`,
        (code, stdout, stderr) => {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stderr).to.be.empty;
            expect(stdout, 'should not indicate the alias used').to.not.contain(TEST_ALIAS);
            expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
            done();
        });
    });

    it('should consider details from the cwd-rc-file if both the rc files contain details about the same alias',
        function (done) {
            fs.writeFileSync(homeRCFile, JSON.stringify(HOME_RC_DATA, null, 2), { mode: RC_FILE_MODE });
            fs.writeFileSync(cwdRCFile, JSON.stringify(CWD_RC_DATA, null, 2), { mode: RC_FILE_MODE });
            currentApiKey = 456;

            proc = exec(`node ../bin/newman.js run ${COLLECTION_API_URL}`,
                (code, stdout, stderr) => {
                    expect(code, 'should have exit code of 0').to.equal(0);
                    expect(stderr).to.be.empty;
                    expect(stdout, 'should indicate that the stored API Key is used')
                        .to.contain('Authenticating using stored API Key');
                    expect(stdout, 'should contain the name of the collection').to.contain(TEST_COLLECTION);
                    done();
                });
        });
});
