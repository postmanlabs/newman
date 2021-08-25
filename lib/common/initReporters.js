var _ = require('lodash'),

    /**
     * load all the default reporters here. if you have new reporter, add it to this list
     * we know someone, who does not like dynamic requires
     *
     * @type {Object}
     */
    defaultReporters = {
        cli: require('../reporters/cli'),
        json: require('../reporters/json'),
        junit: require('../reporters/junit'),
        progress: require('../reporters/progress'),
        emojitrain: require('../reporters/emojitrain')
    },

    /**
     * The object of known reporters and their install instruction in case the reporter is not loaded.
     * Pad message with two spaces since its a follow-up message for reporter warning.
     *
     * @private
     * @type {Object}
     */
    knownReporterErrorMessages = {
        html: '  run `npm install newman-reporter-html`\n',
        teamcity: '  run `npm install newman-reporter-teamcity`\n'
    };

module.exports = function (options, emitter) {
    // ensure that the reporter option type polymorphism is handled
    var reporters = _.isString(options.reporters) ? [options.reporters] : options.reporters;

    // initialize the reporters
    !emitter.reporters && (emitter.reporters = {});
    if (_.isArray(reporters)) {
        _.forEach(reporters, function (reporterName) {
            // disallow duplicate reporter initialisation
            if (_.has(emitter.reporters, reporterName)) { return; }

            var Reporter;

            try {
                // check if the reporter is an external reporter
                Reporter = require((function (name) { // ensure scoped packages are loaded
                    var prefix = '',
                        scope = (name.charAt(0) === '@') && name.substr(0, name.indexOf('/') + 1);

                    if (scope) {
                        prefix = scope;
                        name = name.substr(scope.length);
                    }

                    return prefix + 'newman-reporter-' + name;
                }(reporterName)));
            }
            // @todo - maybe have a debug mode and log error there
            catch (error) {
                if (!defaultReporters[reporterName]) {
                    // @todo: route this via print module to respect silent flags
                    console.warn(`newman: could not find "${reporterName}" reporter`);
                    console.warn('  ensure that the reporter is installed in the same directory as newman');

                    // print install instruction in case a known reporter is missing
                    if (knownReporterErrorMessages[reporterName]) {
                        console.warn(knownReporterErrorMessages[reporterName]);
                    }
                    else {
                        console.warn('  please install reporter using npm\n');
                    }
                }
            }

            // load local reporter if its not an external reporter
            !Reporter && (Reporter = defaultReporters[reporterName]);

            try {
                // we could have checked _.isFunction(Reporter), here, but we do not do that
                // so that the nature of reporter error can be bubbled up
                Reporter && (emitter.reporters[reporterName] = new Reporter(emitter,
                    _.get(options, ['reporter', reporterName], {}), options));
            }
            catch (error) {
                // if the reporter errored out during initialisation, we should not stop the run simply log
                // the error stack trace for debugging
                console.warn(`newman: could not load "${reporterName}" reporter`);

                if (!defaultReporters[reporterName]) {
                    // @todo: route this via print module to respect silent flags
                    console.warn(`  this seems to be a problem in the "${reporterName}" reporter.\n`);
                }
                console.warn(error);
            }
        });
    }

    // raise warning when more than one dominant reporters are used
    (function (reporters) {
        // find all reporters whose `dominant` key is set to true
        var conflicts = _.keys(_.transform(reporters, function (conflicts, reporter, name) {
            reporter.dominant && (conflicts[name] = true);
        }));

        (conflicts.length > 1) && // if more than one dominant, raise a warning
            console.warn(`newman: ${conflicts.join(', ')} reporters might not work well together.`);
    }(emitter.reporters));
};
