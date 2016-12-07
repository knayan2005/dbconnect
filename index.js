(function() {
    "use strict";
    /**
    	@author: Nayan
        It is the default Database connection object,which can be used for firing queries.
        DBase is exposing few methods like,
            1. query //for select queries
            2. insert //for insert queries
            3. insert //for update queries
        Use: Create the new object of DBase by passing dbname and slave details
                and use the above methods.
            like, var dObject =
                new DBase({dbname:"{{dbname}}",slave:"true/false"(optional)});
    */
    var DBase = require("./lib/dbase");

    module.exports = DBase;

    //it is useful to directly make queries in shard db
    module.exports.queryForOrg = DBase.queryForOrg;

    //it is useful to directly make queries in shard db
    module.exports.updateForOrg = DBase.updateForOrg;
}());
