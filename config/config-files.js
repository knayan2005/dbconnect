"user strict";

module.exports = {
	"ServiceConfig" : "/etc/capillary/php-config-util/services-config.ini",
	"CheetahServiceConfig" : "/etc/capillary/php-config-util/cheetah-services-config.ini",
	"OrgShardConfig" : "/etc/capillary/php-config-util/org-shards.ini",
	"CheetahConfig" : "/etc/capillary/php-config-util/cheetah-config.ini"
};

//connection limit is set for different dbs user can add more db if not set then it will take 10 as a limit
module.exports.DBMaxConnectionLimit = {
	"INTOUCH_DB_MYSQL_MASTER" : 50,
	"INTOUCH_DB_MYSQL_SLAVE" : 15,
	"INTOUCH_META_DB_MYSQL_MASTER":50,
	"INTOUCH_META_DB_MYSQL_SLAVE" : 15,
	"AUTHORIZATION_DB_MYSQL": 30,
	"REGISTRAR_DB_MYSQL_MASTER": 15
};