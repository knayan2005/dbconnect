"use strict";
/**
	@author: Nayan
	This class is used to make shardmanager java service calls
	and works like shardmanager client sdk
*/
var Config = require("../config"),
	ShardManagerRequest = require("./lib/shard-mgr-request");

var ShardManagerClient = function ShardManagerClient() {
	console.log("--Shard Manager client init--");
};

ShardManagerClient.getOrgShardForService =
	function getOrgShardForService(orgId, serviceName) {

	return new Promise((resolve, reject) => {

		var ShardMgrRequest = new ShardManagerRequest(
				"orgs/" + orgId + "/services/name/" + serviceName
			);

		ShardMgrRequest.execute(function(err,response){
		    if (err) {
		        console.log("Error:",err);
				reject(err);
		    }
		    else {
				response = JSON.parse(response);
				if (response['orgs']['count'] == 0) {
					reject(new Error("org shard config is not found"));
				}
				else {
					console.log("Success:",response);
					resolve(
						response['orgs']['org'][0]['services']['service'][0]['shards'][0]['name']
					);
				}
		    }
		});
	});
};

ShardManagerClient.getShardsForService =
	function getShardsForService(serviceName) {

	return new Promise((resolve, reject) => {

		var ShardMgrRequest = new ShardManagerRequest(
				"/services/name/" + serviceName + "/shards"
			);

		ShardMgrRequest.execute(function(err,response){
		    if (err) {
		        console.log("Error:",err);
				reject(err);
		    }
		    else {

				console.log("Success:",response);
				response = JSON.parse(response);

				var shardsArray = response['services']['service']['shards'];
				//array of shard names
				var shards = [];
				for (var key in shardsArray) {
	  				if (shardsArray.hasOwnProperty(key)) {
	  				 	shards.push(shardsArray[key]);
	  			  	}
	  		  	}
				resolve(shards);
		    }
		});
	});
};

//@TODO: need to implement it, it is least used method so skipping for now
ShardManagerClient.getShardsForOrgsAndServices =
	function getShardsForService(orgList, serviceList) {};

//@TODO: need to implement it, it is least used method so skipping for now
ShardManagerClient.addOrg = function addOrg(orgId) {};

module.exports = ShardManagerClient;
