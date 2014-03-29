var jsface = require('jsface'),
    ParentModel = require('./ParentModel.js');

/** 
 * @class FolderModel 
 * @classdesc FolderModel class that inherits from ParentModel representing
 * a postman folder object.
 * @extends ParentModel
 * @param folderJson {JSON} Folder JSON object from Postman.
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
