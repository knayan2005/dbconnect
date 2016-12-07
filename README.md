DB Connect
=========

A library that handles db operations of capillary db services with shard support

## Installation

  `npm install dbconnect`

## Usage

    var DBase = require('dbconnect');

    var dObject = new DBase({dbname:"authorization"});
	
	1. Output should be number of affected rows 
		
		dObject.query("select * from {{table}} where id = ?",[{{id}}])
	    	.then(function(rows){
	        	console.log(rows);
	    	});

	2. Output should be latest inserted id

		dObject.insert(
			"INSERT INTO {{table_name}} (`name`) VALUES (?)",['nayan1'])
		    .then(function(rows){
	        	console.log(rows);
	     	});

    3. Output should be true or false

		dObject.update(
			"UPDATE modules SET {{col}}=? where id = ?",["{{value}}","{{id}}"])
	     	.then(function(rows){
	        	console.log(rows);
	    	});

    4. Output should be number of affected rows 

		DBase.queryForOrg(
			"select * from {{table_name}} where id = ?",[{{id}}],
	    	{
	    		"orgId":{{orgId}},
	    		dbname:"{{table_name}}",
	    		slave:{{true|false}}(optional)
	    	})
		    .then(function(rows){
		        console.log(rows);
		    });

    5. Output should be true or false

	    DBase.updateForOrg(
	    	"UPDATE {{table_name}} SET {{col}}=? where id = ?",["{{val}}","{{id}}"],
	     	{
		    		"orgId":{{orgId}},
		    		dbname:"{{table_name}}",
		    		slave:{{true|false}}(optional)
		    })
	     	.then(function(rows){
	        	console.log(rows);
	     	});

## Tests

  `npm test`

## Contributing

In lieu of a formal style guide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code.