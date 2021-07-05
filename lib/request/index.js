var runtime = require('postman-runtime'),
    util = require('./util');

const req = function (options, callback) {
    var runner = new runtime.Runner();

    const collection = util.convert(options.curl, callback);

    runner.run(collection, {}, function (err, run) {
        console.log(err); // eslint-disable-line
        console.log(run); // eslint-disable-line
    });
};

module.exports = req;
