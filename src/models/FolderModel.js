var jsface = require('jsface'),
    ParentModel = require('./ParentModel.js');

var FolderModel = jsface.Class(ParentModel, {
    constructor: function(folderJson) {
        this.$class.$super.call(this, folderJson);
        this.order = folderJson.order;
    },
    toString: function() {
        return "Folder: " + this.name;
    }
});

module.exports = FolderModel;
