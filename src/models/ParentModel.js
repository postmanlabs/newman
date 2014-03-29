var jsface = require('jsface');

/**
 * @class ParentModel
 * @param modelJson {JSON} Takes a JSON as the input 
 */
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
