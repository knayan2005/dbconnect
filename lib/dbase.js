"use strict";
/**
	@author: Nayan
	It is the main class which handles all the external operations which are
	comming from different sources
*/
var _ = require("underscore"),
	ServiceMapper = require("./service-mapper"),
	mysql = require("mysql"),
	Promise = require("bluebird"),
	using = Promise.using;

//promisify all methods of PoolCluster and Connection
Promise.promisifyAll(require("mysql/lib/Connection").prototype);
Promise.promisifyAll(require("mysql/lib/PoolCluster").prototype);

//private variables
var pOptions, //this holds value of current database configuration for which Dbase object has just created
	dbi, // class object either ShardDBI or MetaDBI
	conn, // connection object
	service, // service name
	shard, // shard number in which passed org is in
	slave, // slave true/false
	sharded, // boolean true/false
	shardManager, // ShardManager object in case of shard dbase
	dbname, //dbname
	currentOrg = { orgId : 0 }; // current proxy org object

//create pool cluster object to fire queries
var poolCluster = null;

function DBase(options) {

	var opts = {
		"slave" : false
	};

	pOptions = _.extend(opts, options);

	if (!pOptions.dbname) {
		throw new Error("Database is not selected");
	}

	console.log("--Dbase init with", pOptions.dbname,pOptions.slave);

    if (DBase.requestID == false) {
        DBase.requestID = new Date().getTime();
    }

    //if (isUndefined(DBase.dbDetails, pOptions.dbname, pOptions.slave)) {
	if (
		DBase.dbDetails[pOptions.dbname] === undefined
			||
		DBase.dbDetails[pOptions.dbname][pOptions.slave] === undefined
	) {

	    service = ServiceMapper.getServiceNameForDb(
	    				pOptions.dbname,
	    				pOptions
	    			);

	    var params = ServiceMapper.getDbParams(pOptions.dbname);

	    sharded = params['sharded'] ? true : false;
	    dbname = pOptions.dbname;
	    slave = pOptions.slave;

	    //added meta dbase connection support for backward compatibility
	    if (sharded) {
	    	dbi = require("./shard-dbi");
	    }
	    else {
	    	console.log("@@@Switching to MetaDbi as database service [",
				service ,"] is not sharded");
	    	dbi = require("./meta-dbi");
	    }

	    var dbDetail = {
	     			"params" : params,
	     			"sharded" : sharded,
	     			"service" : service,
	     			"dbi" : dbi
	     		};

		DBase.dbDetails[dbname] = { [slave] : dbDetail };
	}
    else {

		var params = DBase.dbDetails[pOptions.dbname][pOptions.slave]["params"];
		dbname = pOptions.dbname;
        slave = pOptions.slave;

        sharded = DBase.dbDetails[dbname][slave]["sharded"];
        service = DBase.dbDetails[dbname][slave]["service"];
        dbi = DBase.dbDetails[dbname][slave]["dbi"];
    }

	poolCluster = mysql.createPoolCluster({debug:true,removeNodeErrorCount:1});
};

DBase.SERVICE_TYPE = "dbs";
DBase.requestCount = 0;
DBase.dbDetails = {};
DBase.requestID = false;
DBase.timer = false;

function execQuery(sql) {

	if (slave && isWriteQuery(sql)) {
		console.log("Trying to fire a DML query on slave", sql);
        // var msg = "Trying to fire a DML on slave, $sql";
        // Util.sendEmail("apps-dev@capillary.co.in", 'DML on slave', msg, 0);
        throw new Error("Trying to run DML on slave");
    }

    //added non sharded dbase connection support for backward compatibility
    if (sharded) {

		if (currentOrg == undefined || currentOrg.orgId < 0) {
			console.log("Org id not set !! Throwing exception!");
	        throw new Error("OrgId is not found during Dbase invocation");
		}

	    var orgId = currentOrg.orgId;

		var shardManager = require("./shard-manager");

		return shardManager.getShard(orgId, DBase.SERVICE_TYPE, service)
			.then(function (shard) {

				console.log(
							"Dbase Connection created org:",orgId,
							"service:",service,
							"shard:",shard,
							"slave:",slave
						);

				var connConfig = dbi.getConnection(
		    				service, shard, dbname, pOptions
		    			);

				if(!poolCluster._getNode(service)) {
			        poolCluster.add(service, connConfig);
			    }

				DBase.requestCount++;

				return poolCluster.getConnectionAsync(service)
					.disposer(function (connection) {
						return connection.destroy();
					});

			}).catch(function (err) {
				throw new Error("Error while fetching shard details",err);
			});
    }
    else {

    	console.log("@@@executing query on non sharded database as",
			service,"is not sharded");

		var connConfig = dbi.getConnection(dbname, pOptions);

		if(!poolCluster._getNode(service)) {
			console.log(connConfig);
			poolCluster.add(service, connConfig);
		}

		DBase.requestCount++;

		return poolCluster.getConnectionAsync(service)
			.disposer(function (connection) {
				return connection.destroy();
			});
	}
}

function runQuery(sql, params, opts) {

	try{
		//formatting the query before executing
		var sql = mysql.format(sql, params);
		var start = new Date().getTime();

		console.log("Trying to execute Query:",sql);

		//quering for sharded DB
		if(opts !== undefined && opts.isSharded){

			return using(execShardedQuery(sql, opts), function (connection) {
			     return connection.queryAsync(sql);
			}).then(function (rows) {

				var end = new Date().getTime();
				var rowsAffected = rows.length === undefined ?
						rows.affectedRows : rows.length;

				console.log( "Executed SQL [",opts.dbname,"] -",sql,
			        	", Time taken:",(end-start)/1000,
						"s, No. of rows affected:",rowsAffected
			        );

			    return rows;
			}).catch(function(err){

				console.log("DB Error while executing the query:",err);
				return [];
			});
		}
		else {

			return using(execQuery(sql), function (connection) {
			     return connection.queryAsync(sql);
			}).then(function (rows) {

				var end = new Date().getTime();
				var rowsAffected = rows.length === undefined ?
						rows.affectedRows : rows.length;
				console.log( "Executed SQL [",pOptions.dbname,"] -",sql,
			        	", Time taken:",(end-start)/1000,
						"s, No. of rows affected:",rowsAffected
			        );

			    return rows;
			}).catch(function (err) {

				console.log("DB Error while executing the query:",err);
				return [];
			});
		}
	}catch (err) {
		console.error("DB Error while executing the query:", err);
		return [];
	}
}

function execShardedQuery(sql, options) {

	var shardManager = require("./shard-manager");

	var poolCluster = mysql.createPoolCluster({debug:true,removeNodeErrorCount:1});

	return shardManager.getShard(
			options.orgId, DBase.SERVICE_TYPE, options.service
		)
		.then(function (shard) {

			console.log(
						"Sharded Dbase Connection created org:",options.orgId,
						"service:",options.service,
						"shard:",shard,
						"slave:",options.slave
					);

			var connConfig = options.dbi.getConnection(
						options.service, shard, options.dbname, options
					);

			if(!poolCluster._getNode(options.service)) {
				poolCluster.add(options.service, connConfig);
			}

			return poolCluster.getConnectionAsync(options.service)
				.disposer(function (connection) {
					return connection.destroy();
				});

		}).catch(function (err) {
			throw new Error("Error while fetching shard details",err);
		});
}

function isWriteQuery(sql) {

	var regexp = /^CREATE |^UPDATE |^DELETE |^DROP |^INSERT /i;

	if (regexp.test(sql)) {
		return true;
	}

	return false;
}

DBase.prototype.query = function query(sql, params) {

	try{
		return runQuery(sql, params).then(function (rows) {
			return rows;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve([]);
	}
}

DBase.prototype.insert = function insert(sql, params) {

	try{
		return runQuery(sql, params).then(function (rows) {
			return rows.insertId === undefined ? -1 : rows.insertId;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve(-1);
	}
}

DBase.prototype.update = function update(sql, params) {

	try{
		return runQuery(sql, params).then(function (rows) {
			return rows.affectedRows === undefined ? false : true;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve(false);
	}
}

DBase.prototype.queryScalar = function queryScalar(sql, params) {

	try{
		return runQuery(sql, params).then(function (rows) {
			return rows.length;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve(false);
	}
}

//Some static methods which can be used for shard db calls
//@TODO: need to implement this method if required.
DBase.queryAllShards = function queryAllShards(sql, options) {}

DBase.queryForOrg = function queryForOrg(sql, params, options) {

	try{
		var opts = {
			"slave" : false
		};

		options = _.extend(opts, options);

		if (!options.dbname) {
			throw new Error("Database is not selected");
		}

		if (options.orgId == undefined || options.orgId < 0) {
			console.log("Org id not set !! Throwing exception!");
	        throw new Error("OrgId is not found during Dbase invocation");
		}

		console.log("@@Query for Org", options);

		var serviceName = ServiceMapper.getServiceNameForDb(
		    		options.dbname,
		    		options.slave
		    	);

		var dbParams = ServiceMapper.getDbParams(options.dbname),
			isSharded = dbParams['sharded'] ? true : false;

		if (!isSharded) {
			console.log("DB service is not sharded !! Throwing exception!");
	        throw new Error("DB service is not sharded !! Throwing exception!");
		}

		//setting up private variables to resuse executequery method
		var opts = {
			dbname: options.dbname,
			slave: options.slave,
			service: serviceName,
			orgId: options.orgId,
			isSharded: isSharded,
			dbi: require("./shard-dbi")
		}

		return runQuery(sql, params, opts).then(function (rows) {
			return rows;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve([]);
	}
}

DBase.updateForOrg = function updateForOrg(sql, params, options) {

	try{
		var opts = {
			"slave" : false
		};

		options = _.extend(opts, options);

		if (!options.dbname) {
			throw new Error("Database is not selected");
		}

		if (options.orgId == undefined || options.orgId < 0) {
			console.log("Org id not set !! Throwing exception!");
	        throw new Error("OrgId is not found during Dbase invocation");
		}

		console.log("@@Query update for Org", options);

		var serviceName = ServiceMapper.getServiceNameForDb(
		    		options.dbname,
		    		options.slave
		    	);

		var dbParams = ServiceMapper.getDbParams(options.dbname),
			isSharded = dbParams['sharded'] ? true : false;

		if (!isSharded) {
			console.log("DB service is not sharded !! Throwing exception!");
	        throw new Error("DB service is not sharded !! Throwing exception!");
		}

		//setting up private variables to resuse executequery method
		var opts = {
			dbname: options.dbname,
			slave: options.slave,
			service: serviceName,
			orgId: options.orgId,
			isSharded: isSharded,
			dbi: require("./shard-dbi")
		}

		return runQuery(sql, params, opts).then(function (rows) {
			return rows.affectedRows > 0 ? true : false;
		});
	}catch(err) {
		console.error("Exception while executing query:",err);
		return Promise.resolve(false);
	}
}

module.exports = DBase;
