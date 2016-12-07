"use strict";

var redis = require('redis'),
	PropertiesReader = require('./prop-reader'),
	properties = PropertiesReader('/etc/capillary/redis.properties'),
	client = null;

/**
	@author: Nayan
	This class use as cache manager through out the app. It will create the singleton object
	at start.
*/
var CacheMgr = module.exports = function CacheMgr() {

	console.log("--------- Cache Manager Init from Arya DBConnect-----------");

	client = redis.createClient({
		host : properties.get('host'),
		port : properties.get('port')
	});

	client.on('connect', function () {
	    console.log('Redis cache server connected with Arya DBConnect');
	});

	client.on('error', function (err) {
	    console.log('Arya DBConnect Redis cache server Error event-',client.host
		 	,':',client.port,' - ',err);
	});
};

CacheMgr.getInstance = function getInstance() {

	if (CacheMgr.instance == null)
		CacheMgr.instance = new CacheMgr();

	return CacheMgr.instance;
};

CacheMgr.prototype.set = function set(key, value, ttl) {

	return new Promise((resolve, reject) => {

        if (client) {

        	console.log("CacheMgr :: Setting key ::",key);

        	value = JSON.stringify(value);

        	// Set a value with an expiration
    		client.set(key, value, function (err, reply) {

    			if (err) {

    				console.log("Error in storing key in cache");
    				reject({msg: "Error in storing key in cache",code: "-3000"});
    			}
				else {
    				//ttl will be in seconds
    	    		client.expire(key, ttl);
    				console.log("Cache key set successfully:",key);
    				resolve(value);
    			}
    		});
		}
		else {
			reject({msg: "Cache server not available", code: "-3000"});
		}
	});
};

CacheMgr.prototype.get = function get(key) {

	return new Promise((resolve, reject) => {

        if (client) {

        	console.log("CacheMgr :: Getting key value::", key);

        	// Set a value with an expiration
    		client.get(key, function (err, reply) {

    			if (reply) {

    				console.log("Value found in cache server for key:",key);
    				reply = JSON.parse(reply);
    				resolve(reply);
    			}
				else {

    				console.log("No value found in cache server for key:",key);
    				reject(false);
    			}
    		});
		}
		else {
			reject({msg: "Cache server not available", code: "-3000"});
		}
	});
};

CacheMgr.prototype.delete = function (key) {

	return new Promise((resolve, reject) => {

        if (client) {

        	console.log("CacheMgr :: Deleting key::",key);

        	// Set a value with an expiration
    		client.del(key, function (err, reply) {

    			if (reply) {

    				console.log("Value deleted in cache server for key:",key);
    				resolve(true);
    			}
				else {

    				console.log("Error in deleting key:",key);
    				reject(false);
    			}
    		});
		}
		else {

			console.log("Error in deleting key:",key);
			reject({msg: "Cache server not available", code: "-3000"});
		}
	});
};
