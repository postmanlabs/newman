const ALL_CURL_OPTIONS = {
    userAgent: {
        short: '-A',
        long: '--user-agent',
        description: 'An optional user-agent string',
        format: '<string>',
        collectValues: false
    },
    data: {
        short: '-d',
        long: '--data',
        // eslint-disable-next-line max-len
        description: 'Sends the specified data to the server with type application/x-www-form-urlencoded. application/x-www-form-urlencoded',
        format: '[string]',
        collectValues: true
    },
    dataRaw: {
        long: '--data-raw',
        // eslint-disable-next-line max-len
        description: 'Sends the specified data to the server with type application/x-www-form-urlencoded. application/x-www-form-urlencoded',
        format: '[string]',
        collectValues: true
    },
    dataUrlencode: {
        long: '--data-urlencode',
        // eslint-disable-next-line max-len
        description: 'Sends the specified data to the server with type application/x-www-form-urlencoded. application/x-www-form-urlencoded',
        format: '[string]',
        collectValues: true
    },
    dataBinary: {
        long: '--data-binary',
        description: 'Data sent as-is',
        format: '[string]',
        collectValues: false
    },
    get: {
        short: '-G',
        long: '--get',
        // eslint-disable-next-line max-len
        description: 'Forces the request to be sent as GET, with the --data parameters appended to the query string',
        collectValues: false
    },
    header: {
        short: '-H',
        long: '--header',
        description: 'Add a header (can be used multiple times)',
        format: '[string]',
        collectValues: true
    },
    form: {
        short: '-F',
        long: '--form',
        description: 'A single form-data field',
        format: '<name=content>',
        collectValues: true
    },
    request: {
        short: '-X',
        long: '--request',
        description: 'Specify a custom request method to be used',
        format: '[string]',
        collectValues: false
    },
    head: {
        short: '-I',
        long: '--head',
        // eslint-disable-next-line max-len
        description: 'Forces the request to be sent as HEAD, with the --data parameters appended to the query string',
        collectValues: false
    },
    uploadFile: {
        short: '-T',
        long: '--upload-file',
        // eslint-disable-next-line max-len
        description: 'Forces the request to be sent as PUT with the specified local file to the server',
        format: '[string]',
        collectValues: true
    }
};

module.exports = { ALL_CURL_OPTIONS };
