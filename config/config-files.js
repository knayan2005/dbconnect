"user strict";

module.exports = {
	"ServiceConfig" : "/etc/capillary/php-config-util/services-config.ini",
	"CheetahServiceConfig" : "/etc/capillary/php-config-util/cheetah-services-config.ini",
	"OrgShardConfig" : "/etc/capillary/php-config-util/org-shards.ini",
	"CheetahConfig" : "/etc/capillary/php-config-util/cheetah-config.ini"
};

//connection limit is set for different dbs user can add more db if not set then it will take 10 as a limit
module.exports.DBConfigs = {
	"INTOUCH_DB_MYSQL_MASTER" : {
		"connectionLimit" : 30
	},
	"INTOUCH_DB_MYSQL_SLAVE" : {
		"connectionLimit" : 15
	},
	"INTOUCH_META_DB_MYSQL_MASTER" : {
		"connectionLimit" : 15
	},
	"INTOUCH_META_DB_MYSQL_SLAVE" : {
		"connectionLimit" : 15
	},
	"AUTHORIZATION_DB_MYSQL" : {
		"connectionLimit" : 15
	},
	"REGISTRAR_DB_MYSQL_MASTER" : {
		"connectionLimit" : 15
	}
};
