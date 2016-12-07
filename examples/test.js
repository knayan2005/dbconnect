"use strict";
/**
	@author: Nayan
	this file is used to unit test the dbconnect module for different types of
    queries
*/

//loading dbconnect index.js file
var DBase = require("..");

//Sample examples how to use dbconnect module
var dObject = new DBase({dbname:"authorization"});
dObject.query("select * from modules where id = ? and name = ?",[1,'Loyalty'])
    .then(function(rows){
        console.log(rows);
    });

// dObject.insert("INSERT INTO {{table_name}} (`name`, `code`) VALUES (?,?)",['nayan1','Nayan1'])
//     .then(function(rows){
//         console.log(rows);
//     });

// dObject.update("UPDATE modules SET notes = ? where id = ? and name = ?",["漢字",1,'Loyalty'])
//     .then(function(rows){
//         console.log(rows);
//     });

DBase.queryForOrg("select * from users where id = ?",[3],
    {"orgId":0,dbname:"users"})
    .then(function(rows){
        console.log(rows);
    });

// DBase.updateForOrg("UPDATE users SET secretq = ? where id = ?",["abc",3],
//     {"orgId":0,dbname:"users"})
//     .then(function(rows){
//         console.log(rows);
//     });
