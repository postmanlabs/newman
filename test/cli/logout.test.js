/* eslint-disable no-process-env */
const fs = require('fs'),
    sh = require('shelljs'),
    join = require('path').join,

    USER_NOT_FOUND = 'User not found.',
    SUCCESS_MESSAGE = 'Logout successful.';

describe('Logout command', function () {
    let outDir = join(__dirname, '..', '..', 'out'),
        rcFile = join(outDir, '.postman', 'newmanrc'),
        isWin = (/^win/).test(process.platform),
        homeDir = process.env[isWin ? 'userprofile' : 'HOME'],
        fileData = {
            login: {
                _profiles: [
                    {
                        alias: 'default'
                    }
                ]
            }
        };

    before(function () {
        sh.test('-d', outDir) && sh.rm('-rf', outDir);
        sh.mkdir('-p', outDir);
        sh.mkdir('-p', join(outDir, '.postman'));
        sh.touch(rcFile) && sh.chmod(600, rcFile);

        // change the home directory to alter the location of the rc file
        process.env[isWin ? 'userprofile' : 'HOME'] = outDir;

        fs.writeFileSync(rcFile, JSON.stringify(fileData, null, 2));
    });

    after(function () {
        sh.rm('-rf', outDir);
        // update the home directory back to its original value
        process.env[isWin ? 'userprofile' : 'HOME'] = homeDir;
    });

    it('should work if the user exists', function (done) {
        exec('node ./bin/newman.js logout', function (code, stdout, stderr) {
            expect(code, 'should have exit code of 0').to.equal(0);
            expect(stdout, 'should display success message').to.contain(SUCCESS_MESSAGE);
            expect(stderr).to.be.empty;
            done();
        });
    });

    it('should print an error if the user doesn\'t exist', function (done) {
        exec('node ./bin/newman.js logout user', function (code, _stdout, stderr) {
            expect(code, 'should have exit code of 1').to.equal(1);
            expect(stderr, 'should display the error message').to.contain(USER_NOT_FOUND);
            done();
        });
    });
});
