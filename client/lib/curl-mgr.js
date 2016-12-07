var Curl = require("node-libcurl").Curl;

var CurlManager = module.exports = function CurlManager(handle, headers) {

	this.handle = handle;
	this.headers = headers;
};

//private
function doRequest(url, postData, headers, handle) {

	console.log("ShardClient in do request");

	return setCurlOpts(url, postData, headers, handle)
		.then(function(handle){
			return Promise.resolve(handle);
		}).catch(function(err){
			console.error(err);
		});
}

function setCurlOpts(url, postData, headers, handle) {

	return new Promise((resolve,reject) => {

		console.log("ShardClient PostData:", postData);

		if (!headers.length) {
			reject("Headers are not set");
		}
		else {

			if (postData !== false) {
				handle.setOpt(Curl.option.POST, 1);
				handle.setOpt(Curl.option.POSTFIELDS, postData);
			}

			handle.setOpt(Curl.option.URL, url);

			handle.setOpt(Curl.option.HTTPHEADER, headers);

			handle.setOpt(Curl.option.TIMEOUT, 60000);

			handle.setOpt(Curl.option.USERAGENT, "Shard-Manager-Sdk-1.0");

			handle.setOpt(Curl.option.VERBOSE, true);

			resolve(handle);
		}
	});
}

CurlManager.prototype.doGET = function doGET(url, queryParams) {
	console.log("ShardClient headers",this.headers);
	return doRequest(url, false, this.headers, this.handle);
}

CurlManager.prototype.doPOST = function doPOST(url, queryParams, postData){
	console.log("ShardClient headers",this.headers);
	return doRequest(url, postData, this.headers, this.handle);
}
