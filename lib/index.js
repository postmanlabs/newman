const login = require('./login');

module.exports = {
    // @todo: Switch to spread operator when Node v6 support can be dropped
    login: login.login,
    logout: login.logout,
    run: require('./run'),
    version: require('./version')
};
