const sinon = require('sinon'),
    expect = require('chai').expect;

describe('node-version-check', function () {
    let originalVersion;

    beforeEach(function () {
        originalVersion = process.version;
        sinon.replace(console, 'error', sinon.fake());
        sinon.stub(process, 'exit');
    });

    afterEach(function () {
        Object.defineProperty(process, 'version', {
            value: originalVersion,
            writable: true,
            configurable: true
        });
        delete require.cache[require.resolve('../../lib/node-version-check')];
        sinon.restore();
    });

    it('should accept a valid Node.js prerelease version matching the engine requirement', function () {
        Object.defineProperty(process, 'version', {
            value: 'v26.8.0-alpha.0.0.0',
            writable: true,
            configurable: true
        });

        delete require.cache[require.resolve('../../lib/node-version-check')];
        require('../../lib/node-version-check');

        expect(process.exit.called).to.be.false;
        expect(console.error.called).to.be.false;
    });

    it('should exit with error for an unsupported Node.js version', function () {
        Object.defineProperty(process, 'version', {
            value: 'v12.0.0',
            writable: true,
            configurable: true
        });

        delete require.cache[require.resolve('../../lib/node-version-check')];
        require('../../lib/node-version-check');

        expect(process.exit.calledOnceWith(1)).to.be.true;
        expect(console.error.calledOnce).to.be.true;
    });
});
