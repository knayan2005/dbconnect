"use strict";
/**
    @author: Nayan
    Request class which is used to make curl call to shardmanager java service
*/
var Curl = require("node-libcurl").Curl,
   	CurlManager = require("./curl-mgr"),
    mainConfig = require("../../config");

var finalURL = null;

var ShardManagerRequest = module.exports = function ShardManagerRequest(url) {
    //build url on creating the object
    buildURL(url);
}

ShardManagerRequest.SERVICE_NAME = "srv/java-lb";

ShardManagerRequest.PREFIX = "sm";

ShardManagerRequest.VERSION = "v1";

ShardManagerRequest.CONTENT_TYPE = "application/json";

ShardManagerRequest.SCHEME = "http";

ShardManagerRequest.REQUEST_ID_HEADER = "X-CAP-APACHE-REQUEST-ID";

//setting up headers to make calls to shard manager service
var getHeaders = function () {

	console.log("getHeaders shard manager service request method");

	var httpHeaders = [];

	httpHeaders.push(ShardManagerRequest.REQUEST_ID_HEADER + ": " + new Date().getTime());
	httpHeaders.push("Accept: " + ShardManagerRequest.CONTENT_TYPE);
	httpHeaders.push("Content-Type: " + ShardManagerRequest.CONTENT_TYPE);
	httpHeaders.push("Cache-Control: no-cache");

	return httpHeaders;
}

//construct URL before making calls to shard manager service
var buildURL = function (url) {
    //http://10.99.0.66/sm/v1/orgs/services/name/INTOUCH_DB_MYSQL_MASTER
    var config = mainConfig.getServiceConfig();
    finalURL = ShardManagerRequest.SCHEME + '://' + config[ShardManagerRequest.SERVICE_NAME]["host"]
        + ':' + config[ShardManagerRequest.SERVICE_NAME]["port"] + '/';
    finalURL += ShardManagerRequest.PREFIX + '/' + ShardManagerRequest.VERSION + '/';
    finalURL += url;
}

ShardManagerRequest.prototype.execute = function execute(cb) {

    console.log("Arya has come to Shard Client execute method", finalURL);
    //orgs/services/name/INTOUCH_DB_MYSQL_MASTER
    var curl = new Curl(),
    	url = finalURL;

    var CurlManagerObj = new CurlManager(curl, getHeaders());

    CurlManagerObj.doGET(finalURL).then(function(handle){
    	handle.perform();
    },function(err){
    	console.log(err);
    	return cb(err,null);
    });

	curl.on('end', function (statusCode, body) {

		console.log("Arya has just got the response from Shard manager service",statusCode,body);

        this.close();

        if (statusCode === 200) {
            return cb(null,body);
        }
        else {
            return cb(body,null);
        }
	},function (err) {

		console.error("Error occured while contacting shard manager service:",err);
		return cb(err,null);
	});

	curl.on('error', curl.close.bind(curl));
}
