const fs = require('fs');
const log4js = require('log4js'); // https://github.com/nomiddlename/log4js-node



var p_environment="dev" // "production"
console.log("current environment : " + p_environment);
if(p_environment == null){
	console.log("please set environment name. valid Values are 'dev' , 'production'");
}


var config = getConfigForCurrentEnvironment();
console.log("\n\tconfig : " + JSON.stringify(config) + "\n\n");


//const log4jconfig = JSON.parse(fs.readFileSync(config.log4j.log4jsConfigurationFile, {encoding : 'utf8'}));

//for log4js layouts see https://nomiddlename.github.io/log4js-node/layouts.html  


log4js.configure({

  appenders: {
    rolling_file: { type: 'file', filename: 'logs/log4j.log' , maxLogSize: 10485760, backups: 10, compress: true, layout: {
      type: 'pattern',
      pattern: '%d %p %z [req_id=%X{request_id}] %m%n'
    }},

    console: { type: 'stdout', layout: {
      type: 'pattern',
      pattern: '%d %[%p%] %z [req_id=%X{request_id}] %m%n'
    }}
  },

  categories: {
    default: { appenders: [ 'rolling_file' ,'console' ], level: 'info' },
    detailed: { appenders: ['rolling_file' , 'console'] , level: 'trace'}
  }

});


//log4js.configure(log4jconfig);

// log4js.configure(log4jconfig, {
// 	reloadSecs : config.log4j.reLoadSecs
// });

var log = log4js.getLogger();
var logDet = log4js.getLogger('detailed'); // no need to use this. one can play around the level attribute inside the "categories" definition above



function getConfigForCurrentEnvironment(){
	var config_file_path = "/xxxxxx/config.json";
	if(p_environment == "dev")
		config_file_path = "conf/config.json";


	var configWholeObj =  JSON.parse(fs.readFileSync(config_file_path, {encoding : 'utf8'}));
	var config;
	configWholeObj.forEach(function(val, index, array) {
		if( val.environment === p_environment ){
			config = val.config;    //Note: There is no way to stop or break a forEach() loop. The solution is to use Array.prototype.every() or Array.prototype.some(). See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/forEach
		}
	});
	return config;
}




module.exports.getLogger = function(){
	return log;
};

module.exports.getConfig = function(){
	return config;
};