const _ = require('lodash'),
    print = require('../../print'),
    { parseCLIArguments, getAPIKeyFromCLIArguments } = require('./helpers/util'),
    uploadRun = require('./helpers/upload-run');

/**
 * Reporter to upload newman run data to Postman servers
 *
 * @param {Object} newman - The collection run object with event handling hooks to enable reporting.
 * @param {Object} _reporterOptions -  A set of reporter specific options.
 * @param {*} collectionRunOptions - A set of generic collection run options.
 * @returns {*}
 */
function PostmanReporter (newman, _reporterOptions, collectionRunOptions) {
    newman.on('beforeDone', (error, o) => {
        if (error || !_.get(o, 'summary')) {
            return;
        }

        // We get the collection id in the collectionRunOptions. But that collection id has the user id stripped off
        // Hence, we try to parse the CLI args to extract the whole collection id from it.
        const processArgs = process.argv,
            { collection, environment } = parseCLIArguments(processArgs),

            // If api key is not present in environment variables, we check if it has been passed
            // seperately as CLI args else we try to get it from collection postman api url
            // eslint-disable-next-line no-process-env
            postmanApiKey = process.env.POSTMAN_API_KEY ||
                collectionRunOptions.postmanApiKey || getAPIKeyFromCLIArguments(processArgs);

        if (!collection) {
            print.lf('Publishing run details to postman cloud is currently supported only for collections specified ' +
                'via postman API link.\n' +
                'Refer: https://github.com/postmanlabs/newman#using-newman-with-the-postman-api');

            return;
        }

        _.set(collectionRunOptions, 'collection.id', collection);

        if (!postmanApiKey) {
            print.lf('Postman api key is required for publishing run details to postman cloud.\n' +
                'Please specify it by adding an environment variable POSTMAN_API_KEY or ' +
                'using CLI arg: --postman-api-key');

            return;
        }

        if (environment) {
            _.set(collectionRunOptions, 'environment.id', environment);
        }
        // Newman adds a random environment object even if the environment was not passed while running the collection
        // so we remove it to make sure it doesnt get published
        else {
            _.unset(collectionRunOptions, 'environment.id');
        }

        try {
            uploadRun(postmanApiKey, collectionRunOptions, o.summary, (error, response) => {
                if (error) {
                    print.lf('Error occurred while uploading newman run data to Postman: ' + error);

                    return;
                }

                print.lf('Newman run data uploaded to Postman successfully.');
                print.lf('You can view the newman run data in Postman at: ' + response.postmanRunUrl);
            });
        }
        catch (err) {
            print.lf('Error occurred while uploading newman run data to Postman: ' + err);
        }
    });
}

module.exports = PostmanReporter;
