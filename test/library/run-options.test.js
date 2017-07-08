/* global describe, it, newman */
var runtimeVersion = require('../../package.json').dependencies['postman-runtime'];

describe('Newman run options', function () {
    var collection = 'test/fixtures/run/single-get-request.json';

    it('should work correctly without any extra options', function (done) {
        newman.run({
            collection: collection
        }, done);
    });

    it('should not work without a collection', function (done) {
        newman.run({
            environment: 'test/fixtures/run/simple-variables.json'
        }, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.eql('newman: expecting a collection to run');
            done();
        });
    });

    it('should not work with empty options', function (done) {
        newman.run({}, function (err) {
            expect(err).to.be.ok();
            expect(err.message).to.eql('newman: expecting a collection to run');
            done();
        });
    });

    it('should fail a collection run with undefined test cases', function (done) {
        newman.run({
            collection: 'test/fixtures/run/undefined-test-checks.json'
        }, function (err, summary) {
            if (err) { return done(err); }

            expect(summary.run.failures).to.have.length(1);
            expect(summary.run.failures[0].error).to.have.property('name', 'AssertionFailure');

            done();
        });
    });

    it('should accept iterationData as an array of objects', function (done) {
        newman.run({
            collection: 'test/integration/steph/steph.postman_collection.json',
            iterationData: require('../integration/steph/steph.postman_data.json')
        }, function (err, summary) {
            expect(err).to.not.be.ok();
            expect(summary.run.failures).to.be.empty();
            done();
        });
    });

    it('should correctly handle a multitude of responses', function (done) {
        newman.run({
            collection: 'test/fixtures/run/response-bodies.json'
        }, function (err, summary) {
            expect(err).to.not.be.ok();
            expect(summary.run.failures).to.be.empty();

            var executions = summary.run.executions;

            expect(executions).to.have.length(3);
            expect(executions[0].response.json()).to.eql({
                args: { source: 'newman-sample-github-collection' },
                headers: {
                    host: 'postman-echo.com',
                    accept: '*/*',
                    'accept-encoding': 'gzip, deflate',
                    'user-agent': `PostmanRuntime/${runtimeVersion}`, // change this when runtime is bumped
                    'x-forwarded-port': '443',
                    'x-forwarded-proto': 'https'
                },
                url: 'https://postman-echo.com/get?source=newman-sample-github-collection'
            });
            // eslint-disable-next-line max-len
            expect(executions[1].response.text()).to.be('<!DOCTYPE html><html><head><title>Hello World!</title></head><body><h1>Hello World!</h1></body></html>');
            // eslint-disable-next-line max-len
            expect(executions[2].response.text()).to.eql('<?xml version="1.0" encoding="utf-8"?><food><key>Homestyle Breakfast</key><value>950</value></food>');

            done();
        });
    });

    it('should correctly handle invalid collection URLs', function (done) {
        newman.run({
            collection: 'https://api.getpostman.com/collections/my-collection-uuid?apikey=my-secret-api-key'
        }, function (err, summary) {
            expect(err).to.be.ok();
            expect(err.message).to.be('Invalid API Key. Every request requires a valid API Key to be sent.');

            // eslint-disable-next-line max-len
            expect(err.help).to.be('Error fetching the collection from the provided URL. Ensure that the URL is valid.');
            expect(summary).to.not.be.ok();

            done();
        });
    });
});
