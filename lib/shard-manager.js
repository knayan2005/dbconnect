"use strict";
/**
	@author: Nayan
	This class is used to handle shard db requests and
	also contact shard manager sdk client to fetch the details
*/
var _ = require('underscore'),
	os = require("os"),
	Config = require("../config"),
	CacheMgr = require("../utils/cache-mgr").getInstance(),
	ShardManagerClient = require("../client/shardmgr-client");

function isUndefined(_arr, _index1, _index2) {
    try { return _arr[_index1][_index2] == undefined; } catch(e) { return true; }
}

var ShardManager = function ShardManager() {

	console.log("--Shard Manager constructor--");

	init()
		.then((data) => {
			console.log("--Shard Manager init Successful--");
		})
		.catch((err) => {
			console.log("--Shard Manager init Failed--");
		});
};

//Static Block
//Static variables initialization
ShardManager.instance = null;

ShardManager.ORG_SHARD_DETAILS = Config.getOrgShardConfig();

ShardManager.DB_TYPE = 'dbs';

ShardManager.SRV_TYPE = 'srv';

ShardManager.CACHE_TTL = 120;

ShardManager.getInstance = function getInstance() {

    if (this.instance === null) {
        this.instance = new ShardManager();
    }

    return this.instance;
};

//Private Block
/**
 * Simple dictionary for containing the list
 * of valid service names.
 **/
var services = [];

/**
 * @var array(orgid => array('service' => 'shard'))
 */
var cache = [];

/**
 * @var array(service => array('shard1', 'shard2'))
 */
var serviceShards = [];

var serviceTypes = ['dbs', 'srv'];

var keyCache = "oa_org-shards.ini" + os.hostname(),
	keyAssocArr = "oa_org_shards_assoc_arr" + os.hostname(),
	keyServiceArr = "oa_shard_mgr_services" + os.hostname(),
	keyServiceCache = "oa_shard_manager_cache" + os.hostname();

function getCacheValue(key) {

  return new Promise((resolve, reject) => {

  	CacheMgr.get( key )
  		.then( ( value ) => {
			return resolve (value);
		})
		.catch( (err) => {
			if( err )
				return reject (err);
			else
				return resolve (false);
  		});
  });
};

function setCacheValue(key, value, ttl) {

  return new Promise((resolve, reject) => {

  	CacheMgr.set(key, value, ttl)
  		.then((value) => {
			return resolve(value);
		})
		.catch((err) => {
			if (err)
				return reject(err);
			else
				return resolve(false);
  		});
  });
};

function init() {

	return new Promise((resolve, reject) => {

		var serviceOrgMap = [];

		Promise.all([
		  getCacheValue(keyCache),
		  getCacheValue(keyAssocArr),
		  getCacheValue(keyServiceArr),
		  getCacheValue(keyServiceCache)
		])
		.then((data) => {

			console.log("Getting Cache keys in Shard Manager init");
			serviceShards = data[0];
			serviceOrgMap = data[1];
			services = data[2];
			cache = data[3];

			//checks for oa_org-shards.ini cache key
			if (!serviceShards) {
				console.error("Service shards not in cache, need file parsing");
			}

			//checks for oa_org_shards_assoc_arr cache key
			if (!serviceOrgMap) {
				serviceOrgMap = ShardManager.ORG_SHARD_DETAILS;
				setCacheValue(keyCache, serviceOrgMap, ShardManager.CACHE_TTL);
			}

			//checks for oa_shard_mgr_services and oa_shard_manager_cache cache keys
			if (cache && services) {
				console.info("returning from the cache");
				return resolve(true);
			}

			if (!cache) {
				cache = [];
			}

			if (!services) {
				services = [];
			}

			console.error("Failed to get mapping or services from cache");

			console.info("looping through the services and create the local cache");

			for (var key in serviceOrgMap) {

			    if (serviceOrgMap.hasOwnProperty(key)) {

			    	key = key.trim();
			    	//console.log("key =", key);
			        //console.log("value =" + serviceOrgMap[key]);
			    	var orgs = _.keys(serviceOrgMap[key]);
			    	for (var okey in orgs) {
			    		var orgId = okey;
			    		var mapValue = serviceOrgMap[key][orgId];
						if (cache[orgId] !== undefined) {
	                        cache[orgId][key] = mapValue;
		                }else{
		                    cache[orgId] = { key : mapValue };
		                }
			    	}
			    	//push service names into Services array
			    	services.push(key);

	            	//push service keys into Service shard array
	            	serviceShards[key] = _.uniq(_.values(serviceOrgMap[key]));
			    }
			}

			console.log("Setting in cache of service shards");
			setCacheValue(keyAssocArr, serviceShards, ShardManager.CACHE_TTL);
			setCacheValue(keyServiceArr, services, ShardManager.CACHE_TTL);
			setCacheValue(keyServiceCache, cache, ShardManager.CACHE_TTL);
			return resolve(true);
		})
		.catch((err) => {
			console.log(err);
			return reject(false);
		});
	});
};

//Public Block
/**
	* Returns the shard of a given tenant for a service
	*
	* @param orgId : Tenant Key
	* @param serviceType : dbs or srv
	* @param serviceName : name of the service being accessed
	* @throws Exception
	* @return string : String
	*/
ShardManager.prototype.getShard =
	function getShard(orgId, serviceType, serviceName) {

	return new Promise((resolve, reject) => {

		//if org id is not passed throw error
		if (orgId < 0) {
			console.log("Invalid orgId:", orgId);
			reject("Invalid orgId:", orgId);
		}

		// TODO: handling of service as a type needs to be implemented
		serviceType = 'dbs';

		//as only the db is sharded right now.
		if (serviceType === ShardManager.DB_TYPE) {

			//fetching the shard given the orgId and service name
			console.log("===Inside Shard getConnection===");
			if (!isUndefined(cache,orgId,serviceName)) {
				var shard = cache[orgId][serviceName];
				console.log("Found shard in server cache:", shard);
				resolve(shard);
			}
			else {
				//shard mapping is not available in the file. go to shard manager
				console.log("Didn't find shard in server cache, looking up from service");
				ShardManagerClient
					.getOrgShardForService(orgId, serviceName)
					.then(function (shardName) {
						console.log("Successful response from shard manager");
						console.log("Found shard name:",shardName);
						// to flush the cache for the org shards
						CacheMgr.delete(keyAssocArr);
						CacheMgr.delete(keyServiceCache);
						resolve(shardName);
					}).catch(function (err) {
						console.log("Error while fetching shard config", err);
						reject(new Error("Couldn't find any shard for service:",
							serviceName,"tenant:", orgId));
					});
			}
		}
	});
};

ShardManager.prototype.getShardsForService =
	function getShardsForService(serviceName) {

  	return new Promise((resolve, reject) => {

		console.log("===Inside getShardsForService===");

		//add logic for fetching all this from shard manager api
		if (serviceShards[serviceName] !== undefined) {
			console.log("Found the shards in the local file");
		 	resolve(serviceShards[serviceName]);
		}
		else {
		  //shard mapping is not available in the file. go to shard manager
		  console.log("Didn't find shards in server cache, looking up from service");
		  ShardManagerClient
			  .getShardsForService(serviceName)
			  .then(function (shards) {
				  console.log("Successful response from shard manager");
				  console.log("Found shards:",shards);
				  // to flush the cache for the org shards
				  CacheMgr.delete(keyAssocArr);
				  CacheMgr.delete(keyServiceCache);
				  resolve(shards);
			  }).catch(function (err) {
				  console.log("Can't load shards for service.", err);
				  reject(new Error("Can't load shards for service:",
					  serviceName));
			  });
	  	}
	});
};

module.exports = ShardManager.getInstance();
