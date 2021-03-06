"use strict";
/**
	@author: Nayan
	This class is used to fetch service config details of db and services
    by reading the php-config-util files.
*/
var ini = require('node-ini'),
    cfg = require('./config-files');

function mainConfig() {};

mainConfig.getServiceConfig = function getServiceConfig() {

    return ini.parseSync( cfg.ServiceConfig );
}

mainConfig.getCheetahServiceConfig = function getCheetahServiceConfig() {

    return ini.parseSync( cfg.CheetahServiceConfig );
}

mainConfig.getOrgShardConfig = function getOrgShardConfig() {

    return ini.parseSync( cfg.OrgShardConfig );
}

mainConfig.getCheetahConfig = function getCheetahConfig() {

    return ini.parseSync( cfg.CheetahConfig );
}

mainConfig.getDBMaxLimitConfig = function getDBMaxLimitConfig(dbService) {

    return typeof cfg.DBMaxConnectionLimit[dbService] === 'undefined' ?
                10 : cfg.DBMaxConnectionLimit[dbService];
}

module.exports = mainConfig;
