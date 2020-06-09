/* eslint-disable no-process-env */
var fs = require('fs'),
    sh = require('shelljs'),
    sinon = require('sinon'),
    join = require('path').join,
    liquidJSON = require('liquid-json'),
    rcFile;


describe('rc files', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        configDir = join(outDir, '.postman'),
        rcfile = join(configDir, 'newmanrc'),
        isWin = (/^win/).test(process.platform),
        homeDir = process.env[isWin ? 'userprofile' : 'HOME'],
        sandbox,

        // replaces fileRead function to overcome errors during reading of files
        stubFSRead = (fakeErr, fakeData) => {
            sandbox.stub(fs, 'readFile').callsFake((_file, callback) => {
                return callback(fakeErr, Buffer.from(fakeData, 'utf-8'));
            });
        };

    // all the tests take place assuming 'outDir' is the home directory
    before(function () {
        // change the environment variable related to the home directory
        process.env[isWin ? 'userprofile' : 'HOME'] = outDir;

        // since the module uses home directory
        delete require.cache[require.resolve('../../lib/config/rc-file')];
        rcFile = require('../../lib/config/rc-file');
    });


    after(function () {
        // update the home directory back to its original value
        process.env[isWin ? 'userprofile' : 'HOME'] = homeDir;
    });

    beforeEach(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
        sandbox = sinon.createSandbox();
    });


    afterEach(function () {
        sh.rm('-rf', outDir);
        sandbox.restore();
    });

    describe('load-home-rcfile', function () {
        it('loads data from home rc file', function (done) {
            let data = { a: 5 };

            sh.mkdir('-p', configDir);
            sh.touch(rcfile) && sh.chmod(600, rcfile);
            stubFSRead(null, JSON.stringify(data));

            rcFile.loadHome((err, fileData) => {
                expect(err).to.be.null;
                expect(fs.readFile.calledOnce).to.be.true;
                expect(fs.readFile.args[0][0], 'should read the right rc file').to.eql(rcfile);
                expect(fileData, 'should parse the data to give the JSON object').to.eql(data);
                done();
            });
        });

        it('sends an error if the rc file contains invalid data', function (done) {
            let data = '{';

            sh.mkdir('-p', configDir);
            sh.touch(rcfile) && sh.chmod(600, rcfile);
            stubFSRead(null, data);

            rcFile.loadHome((err) => {
                expect(err).to.have.property('message');
                expect(err.message, 'should send the error message indicating invalid data').to.match(/invalid data/);
                done();
            });
        });

        it('sends empty JSON object without any error if the file doesn\'t exist', function (done) {
            rcFile.loadHome((err, fileData) => {
                expect(err).to.be.null;
                expect(fileData).to.eql({});
                done();
            });
        });
    });

    describe('store-home-rcfile', function () {
        it('creates the file and stores the data in it', function (done) {
            let data = { test: 123 };

            rcFile.storeHome(data, (err) => {
                expect(err).to.be.null;
                fs.readFile(rcfile, (error, fileData) => {
                    expect(error).to.be.null;
                    expect(liquidJSON.parse(fileData.toString()), 'file should contain passed data').to.be.eql(data);
                    done();
                });
            });
        });

        it('should handle the error peacefully if there is one during file creation', function (done) {
            let data = { test: 123 };

            // fake the error
            sandbox.stub(sh, 'touch').callsFake(() => {
                throw new Error();
            });

            rcFile.storeHome(data, (err) => {
                expect(err).to.not.be.null;
                done();
            });
        });
    });
});
