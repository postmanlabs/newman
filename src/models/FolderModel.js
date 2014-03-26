var jsface = require('jsface');

var FolderModel = jsface.Class({
    constructor: function(folderJson){
        this.id          = folderJson.id;
        this.name        = folderJson.name;
        this.description = folderJson.description;
        this.order       = folderJson.order;
    },
    toString: function(){
        return "Folder: " + this.name;
    }
});

module.exports = FolderModel;
