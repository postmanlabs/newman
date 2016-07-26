module.exports = {
    cliTableTemplate_Blank: {
        'top': '',
        'top-mid': '',
        'top-left': '',
        'top-right': '',
        'bottom': '',
        'bottom-mid': '',
        'bottom-left': '',
        'bottom-right': '',
        'middle': '',
        'mid': ' ',
        'mid-mid': '',
        'mid-left': '',
        'mid-right': '',
        'left': '',
        'left-mid': '',
        'left-left': '',
        'left-right': '',
        'right': '',
        'right-mid': '',
        'right-left': '',
        'right-right': ''
    },

    padLeft: function (nr, n, str) {
        return Array(n - String(nr).length + 1).join(str || '0') + nr;
    },

    noTTY: function () {
        return Boolean(process.env.CI) || !process.stdout.isTTY;
    }
};
