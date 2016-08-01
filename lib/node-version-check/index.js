var semver = require('semver'),
    colors = require('colors/safe'),
    pkg = require('../../package.json'),

    /**
     * the required node version from package.json
     * @type {String}
     * @readOnly
     */
    requiredNodeVersion = pkg && pkg.engines && pkg.engines.node,

    /**
     * the current node version as detected from running process
     *
     * @type {String}
     * @readOnly
     */
    currentNodeVersion = process && process.version;

// if either current or required version is not detected, we bail out
if (!(requiredNodeVersion && currentNodeVersion)) {
    return;
}

// we check semver satisfaction and throw error on mismatch
if (!semver.satisfies(currentNodeVersion, requiredNodeVersion)) {
    console.error([colors.red('newman:'), 'required node version', requiredNodeVersion].join(' '));
    process.exit(1);
}
