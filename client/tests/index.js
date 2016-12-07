"use strict";

var ShardManagerRequest = require("../lib/shard-mgr-request");

var ShardMgrRequest = new ShardManagerRequest("orgs/0/services/name/INTOUCH_DB_MYSQL_MASTER");

// var ShardMgrRequest = new ShardManagerRequest("services/name/INTOUCH_DB_MYSQL_MASTER/shards");

ShardMgrRequest.execute(function(err,response){
    if (err) {
        console.log("Error:",err);
    }
    else {
        console.log("Success:",response);
    }
});
