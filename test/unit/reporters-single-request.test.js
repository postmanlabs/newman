describe('Reporter Options', function () {
    it('should correctly work with cli reporter option', function (done) {
        // eslint-disable-next-line max-len
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-json" -r cli', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with progress reporter options', function (done) {
        // eslint-disable-next-line max-len, quotes
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-json" -r progress', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });

    it('should correctly work with json and cli options', function (done) {
        // eslint-disable-next-line max-len, quotes
        exec('node ./bin/newman.js request -X GET "https://5a178277-8664-409c-8e93-d5ee2935d2cb.mock.pstmn.io/get-json" -r json, cli', function (code) {
            expect(code, 'should have exit code of 0').to.equal(0);
            done();
        });
    });
});
