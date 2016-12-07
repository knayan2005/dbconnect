"use strict";
/**
	@author: Nayan
	This class is used to handle shard db requests and create the object which
	is useful while connecting to the shard db using shard manager
*/
var _ = require('underscore'),
	Config = require("../config"),
	//used to resolve the db names to service names
	ServiceMapper = require("./service-mapper");

var ShardedDBI = function ShardedDBI() {
	console.log("--Shard DBI init--");
};

ShardedDBI.instance = null;

ShardedDBI.getInstance = function getInstance() {

    if (this.instance === null) {
        this.instance = new ShardedDBI();
    }
    return this.instance;
}

ShardedDBI.SERVICES_CONFIG = Config.getServiceConfig();

function connectDb(service, shard, dbname, options) {

	console.log("===Inside Shard DBI Connect===");

	var serviceParams = ServiceMapper.getDbParams(dbname, options),
		database = serviceParams['dbase'],
		cfg = ShardedDBI.SERVICES_CONFIG;

	var dbKey = ["dbs", dbname];
	if (options.slave) {
		dbKey.push("slave");
	}
	dbKey.push(shard);
	dbKey = dbKey.join("/");

    var dbParamsObj = cfg[dbKey];

    if (dbParamsObj !== undefined) {

		var opts = {
	        host : dbParamsObj['host'],
	        database : database,
	        user : dbParamsObj['user'],
	        password : dbParamsObj['pass'].replace(/\"/g, ''),
			charset : "utf8mb4",
			connectionLimit : options.connectionLimit || Config.getDBMaxLimitConfig(service)
		};
        return opts;
    }

    throw Error("No DB Config for", dbname);
}

ShardedDBI.prototype.getConnection =
	function getConnection(service, shard, dbname, options) {

		var options = _.extend({slave:false}, options),
			dbParams = ServiceMapper.getDbParams(dbname, options),
			database = dbParams['dbase'];

		//returning the db config from the service
	   	return connectDb(service, shard, dbname, options);
}

module.exports = ShardedDBI.getInstance();
