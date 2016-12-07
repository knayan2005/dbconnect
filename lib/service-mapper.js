"use strict";
/**
	@author: Nayan
	This class is used to handle service mapper requests and fetch the details
	from different files of php-config-util.
*/
var path = require("path"),
	mainConfig = require('../config');

function ServiceMapper () {
	console.log( "---In service-mapper---" );
};

ServiceMapper.prototype.SERVICE_LABEL = "srv";

ServiceMapper.prototype.DB_LABEL = "dbs";

ServiceMapper.prototype.SERVICE_SUFFIX = "service";

ServiceMapper.prototype.serviceConfig = mainConfig.getServiceConfig();

ServiceMapper.prototype.cfg = mainConfig.getCheetahServiceConfig();

ServiceMapper.prototype.getServiceNameForDb =
	function getServiceNameForDb( dbname, options ) {

	var opt = options || { slave : false };

	if( opt.slave ){

		return this
				.cfg[ this.DB_LABEL + "/" + dbname + "/" + "slave" ]
					[ this.SERVICE_SUFFIX ];
	}
	else{

		return this
				.cfg[ this.DB_LABEL + "/" + dbname ]
					[ this.SERVICE_SUFFIX ];
	}
};

ServiceMapper.prototype.getDbParam =
	function getDbParam( dbname, param, options ) {

	var opt = options || { slave : false };

	if( opt.slave ){

		return this
				.cfg[ this.DB_LABEL + "/" + dbname + "/" + "slave" + "/" + param ]
					[ this.SERVICE_SUFFIX ];
	}
	else{

		return this
				.cfg[ this.DB_LABEL + "/" + dbname + "/" + param ]
					[ this.SERVICE_SUFFIX ];
	}
};

ServiceMapper.prototype.getDbParams = function getDbParams( dbname, options ) {

	var opt = options || { slave : false };

	if( opt.slave ){

		return this
				.cfg[ this.DB_LABEL + "/" + dbname + "/" + "slave" ];
	}
	else{

		return this
				.cfg[ this.DB_LABEL + "/" + dbname ];
	}
};

ServiceMapper.prototype.getServiceNameForSrv =
	function getServiceNameForSrv( service ) {

	return this
			.cfg[ this.SERVICE_LABEL + "/" + service ]
				[ this.SERVICE_SUFFIX ];
};

ServiceMapper.prototype.getServiceParam = function
	getServiceParam( service, param ) {

	return this
			.cfg[ this.SERVICE_LABEL + "/" + service ]
				[ this.SERVICE_SUFFIX ];
};

ServiceMapper.prototype.getServiceParams =
	function getServiceParams( service ) {

	return this
			.cfg[ this.SERVICE_LABEL + "/" + service ];
};

ServiceMapper.prototype.getServiceName =
	function getServiceName( options ) {

	var opt = options || { slave : false };

	if( opt.slave ){

		return this
				.cfg[ this.DB_LABEL + "/" + dbname + "/" + "slave" ]
					[ this.SERVICE_SUFFIX ];
	}
	else{

		return this
				.cfg[ this.DB_LABEL + "/" + dbname ]
					[ this.SERVICE_SUFFIX ];
	}
};

module.exports = (function(){
  return new ServiceMapper();
}());
