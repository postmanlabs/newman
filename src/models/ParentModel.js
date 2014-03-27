var jsface = require('jsface');

var ParentModel = jsface.Class({
    constructor: function(modelJson) {
        this.id          = modelJson.id;
        this.name        = modelJson.name;
        this.description = modelJson.description;
    },
    toString: function(){
        // models extending this class should override this method
        return this.name;
    }
});

module.exports = ParentModel;
