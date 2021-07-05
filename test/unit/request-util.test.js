var util = require('../../lib/request/util.js'),
    Collection = require('postman-collection').Collection,
    curl2postman = require('curl-to-postmanv2');

describe('convert', function () {
	var result = {
			result: true,
    		output:[ { type:"request",
    				   data:{ method:"GET", 
    				   	name:"http://google.com", 
    				 	url:"http://google.com", 
    				 	header:[], 
    				 	body:{}, 
    				 	description:"Generated from a curl request: \ncurl  --get http://google.com" 
    				   }
    				 }
    		]};

    let mockCollection = new Collection();

    mockCollection.items.add({
            name: result.output[0] && result.output[0].data.name,
            request: result.output[0] && result.output[0].data
    });

    var value = "curl  --get http://google.com"

    const actualCollection = util.convert(value);

	it('should convert curl command to Postman Collection', function () {
        expect(actualCollection.items.name).to.eql(mockCollection.items.name);
        expect(actualCollection.items.request).to.eql(mockCollection.items.request);
    });
});
