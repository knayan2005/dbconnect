"use strict";
/**
	@author: Nayan
	This class is used to handle meta db requests and create the object which
	is useful while connecting to the db
*/
var _ = require('underscore'),
	Config = require("../config"),
	//used to resolve the db names to service names
	ServiceMapper = require("./service-mapper");

var MetaDBI = function MetaDBI() {
	console.log("--MetaDBI init--");
};

MetaDBI.instance = null;

MetaDBI.getInstance = function getInstance() {

    if (this.instance === null) {
        this.instance = new MetaDBI();
    }
    return this.instance;
}

MetaDBI.SERVICES_CONFIG = Config.getServiceConfig();

function connectDb(dbname, options) {

	console.log("===Inside Meta DBI Connect===");

	var serviceParams = ServiceMapper.getDbParams(dbname, options),
	  	database = serviceParams['dbase'],
	  	service = serviceParams["service"],
	  	cfg = MetaDBI.SERVICES_CONFIG;

	var dbKey = ["dbs", dbname];
	if (options.slave) {
		dbKey.push("slave");
	}
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

	throw new Error("No DB Config for", dbname);
}

MetaDBI.prototype.getConnection = function getConnection(dbname, options) {

	var options = _.extend({ slave : false }, options),
		dbParams = ServiceMapper.getDbParams(dbname, options),
		database = dbParams['dbase'];

	//returning the db config from the service
   	return connectDb(dbname, options);
}

module.exports = MetaDBI.getInstance();
