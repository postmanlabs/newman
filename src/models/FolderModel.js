var jsface = require('jsface'),
    ParentModel = require('./ParentModel.js');

/** 
 * @class FolderModel 
 * FolderModel class that inherits from ParentModel representing
 * a postman folder object.
 */
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
