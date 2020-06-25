/* eslint-disable no-process-env */
var fs = require('fs'),
    sh = require('shelljs'),
    sinon = require('sinon'),
    join = require('path').join,
    liquidJSON = require('liquid-json'),
    rcFile,

    CONFIG_DIR_MODE = 0o700,
    CONFIG_FILE_MODE = 0o600;

describe('RC File Module', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        homeRCDir = join(outDir, '.postman'),
        homeRCFile = join(homeRCDir, 'newmanrc'),
        cwdRCFile = join(outDir, '.newmanrc'),
        isWin = (/^win/).test(process.platform),
        homeDir = process.env[isWin ? 'userprofile' : 'HOME'],
        currentWorkingDir = process.cwd(),
        testData = { test: 123 };

    // all the tests take place assuming 'outDir' is the home directory and the current working directory
    before(function () {
        process.env[isWin ? 'userprofile' : 'HOME'] = outDir; // the same variables are checked in os.homeDir() function
        !fs.existsSync(outDir) && fs.mkdirSync(outDir); // else the next step will throw an error
        process.chdir(outDir);

        // since the module contains cached data related to home, current working directory
        delete require.cache[require.resolve('../../lib/config/rc-file')];
        rcFile = require('../../lib/config/rc-file');
    });

    after(function () {
        // update the home, current working directory back to its original value
        process.env[isWin ? 'userprofile' : 'HOME'] = homeDir;
        process.chdir(currentWorkingDir);
    });

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
    });

    afterEach(function () {
        sh.rm('-rf', outDir);
    });

    describe('load', function () {
        it('should load data from rc file in the home directory by default', function (done) {
            fs.mkdirSync(homeRCDir, { mode: CONFIG_DIR_MODE });
            fs.writeFileSync(homeRCFile, JSON.stringify(testData, null, 2), { mode: CONFIG_FILE_MODE });

            rcFile.load((err, fileData) => {
                expect(err).to.be.null;
                expect(fileData, 'should parse the data to give the JSON object').to.eql(testData);
                done();
            });
        });

        it('should load data from rc file in the current working directory if specified', function (done) {
            fs.writeFileSync(cwdRCFile, JSON.stringify(testData, null, 2), { mode: CONFIG_FILE_MODE });

            rcFile.load(['cwd'], (err, fileData) => {
                expect(err).to.be.null;
                expect(fileData, 'should parse the data to give the JSON object').to.eql(testData);
                done();
            });
        });

        it('should send an error if the rc file contains invalid data', function (done) {
            let data = '{';

            fs.mkdirSync(homeRCDir, { mode: CONFIG_DIR_MODE });
            fs.writeFileSync(homeRCFile, data, { mode: CONFIG_FILE_MODE });

            rcFile.load(['home', 'cwd'], (err) => {
                expect(err).to.not.be.null;
                expect(err).to.have.property('message');
                expect(err.message, 'should send the error message indicating invalid data').to.match(/invalid data/);
                done();
            });
        });

        it('should send an empty JSON object without any error if the file doesn\'t exist', function (done) {
            rcFile.load((err, fileData) => {
                expect(err).to.be.null;
                expect(fileData).to.eql({});
                done();
            });
        });

        it('should merge the data from different rc files according to their priority', function (done) {
            let homeData = {
                    run: { bail: true },
                    login: {
                        _profiles: [
                            { alias: 'default', postmanApiKey: '123' },
                            { alias: 'testAlias', postmanApiKey: '456' }
                        ]
                    }
                },
                cwdData = {
                    run: { bail: false },
                    login: {
                        _profiles: [
                            { alias: 'default', postmanApiKey: '789' }
                        ]
                    }
                },
                mergedData = {
                    run: { bail: false },
                    login: {
                        _profiles: [
                            { alias: 'default', postmanApiKey: '789' },
                            { alias: 'testAlias', postmanApiKey: '456' }
                        ]
                    }
                };

            fs.mkdirSync(homeRCDir, { mode: CONFIG_DIR_MODE });
            fs.writeFileSync(homeRCFile, JSON.stringify(homeData, null, 2), { mode: CONFIG_FILE_MODE });

            fs.writeFileSync(cwdRCFile, JSON.stringify(cwdData, null, 2), { mode: CONFIG_FILE_MODE });

            rcFile.load(['home', 'cwd'], (err, data) => {
                expect(err).to.be.null;
                expect(data, 'should merge the data correctly').to.be.eql(mergedData);
                done();
            });
        });
    });

    describe('store', function () {
        it('should create the home-rc-file and store data in it by default',
            function (done) {
                rcFile.store(testData, (err) => {
                    expect(err).to.be.null;
                    expect(fs.existsSync(homeRCDir), 'should create the config directory').to.be.true;
                    !isWin && expect(fs.statSync(homeRCDir).mode,
                        'config dir should have \'rwx\' permissions only to the owner').to.be.equal(0o40700);
                    expect(fs.existsSync(homeRCFile), 'should create the rc file').to.be.true;
                    !isWin && expect(fs.statSync(homeRCFile).mode,
                        'config file should have \'rw\' permissions only to the owner').to.be.equal(0o100600);

                    fs.readFile(homeRCFile, (err, fileData) => {
                        expect(err).to.be.null;
                        expect(liquidJSON.parse(fileData.toString()), 'file should contain passed data')
                            .to.be.eql(testData);
                        done();
                    });
                });
            });

        it('should create the cwd-rc-file and store data in it if specified', function (done) {
            rcFile.store(testData, 'cwd', (err) => {
                expect(err).to.be.null;
                expect(fs.existsSync(cwdRCFile), 'should create the rc file').to.be.true;
                !isWin && expect(fs.statSync(cwdRCFile).mode,
                    'config file should have \'rw\' permissions only to the owner').to.be.equal(0o100600);

                fs.readFile(cwdRCFile, (err, fileData) => {
                    expect(err).to.be.null;
                    expect(liquidJSON.parse(fileData.toString()), 'file should contain passed data')
                        .to.be.eql(testData);
                    done();
                });
            });
        });

        it('should handle the error gracefully if there is one during folder creation', function (done) {
            // fake the error
            sinon.stub(fs, 'mkdir').callsFake((_dir, _options, cb) => {
                return cb(new Error());
            });

            rcFile.store(testData, 'home', (err) => {
                expect(err).to.not.be.null;
                expect(err).to.have.property('message');
                expect(err.message, 'should send the error indicating dir-create error').to.match(/config directory/);
                fs.mkdir.restore();
                done();
            });
        });
    });
});
