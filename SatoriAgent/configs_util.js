const fs = require('fs');
const log4js = require('log4js'); // https://github.com/nomiddlename/log4js-node
const zookeeper = require('node-zookeeper-client');



var p_environment="dev" // "production"
console.log("current environment : " + p_environment);
if(p_environment == null){
	console.log("please set environment name. valid Values are 'dev' , 'production'");
}


var config = getConfigForCurrentEnvironment();
console.log("\n\tconfig : " + JSON.stringify(config) + "\n\n");

var primaryCategoriesList = [];
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





//Zoo keeper {
var zkClient = zookeeper.createClient(config.zookeeper.zkHostsPortsConnectionString);
const zNodeWithCategoryListPath = config.zookeeper.pathOfzNodeHavingCategoryList;
log.info("zNodeWithCategoryListPath : ${zNodeWithCategoryListPath}");

zkClient.once('connected', function () {
    log.info('Connected to the zookeeper server.');

    //check if znode for category details exist, if not create it
	zkClient.exists(zNodeWithCategoryListPath, zNodeModified, function (error, stat) {
	    if (error) {
	        log.error("znode exists check returned error for zNode '${zNodeWithCategoryListPath}' : ${error.stack}");
	        return;
	    }

	    if (stat) {
	        log.info('zNode ${zNodeWithCategoryListPath} exists already with stat : ${stat}');
	    } else {
	        log.info('zNode ${zNodeWithCategoryListPath} does not exist, so going to create with watch');

	        zkClient.create(zNodeWithCategoryListPath, function (error) {
	        	if (error) {
	            	log.error('Failed to create node: %s due to: %s.', zNodeWithCategoryListPath, error);
	            	return;
	        	} else {
	            	log.info('Node: %s is successfully created.', zNodeWithCategoryListPath);
	        	}
    		});
	    }

	});

});

zkClient.connect();






function zNodeModified(event){
	log.info("Received zNode modified event : %s ",event);
	if(event.getType() == NODE_DATA_CHANGED && event.getPath() == zNodeWithCategoryListPath){
		getzNodeData(zNodeWithCategoryListPath);		
	}
}


function getzNodeData(zNodePath){
	zookeeper.getData(
	    zNodePath,
	    zNodeModified,
	    function (error, data, stat) {
	        if (error) {
	            log.error("Error while trying to get data from zNode '${zNodePath}' : ${error.stack}");
	            return;
	        }

	        log.info('Got data: %s', data.toString('utf8'));

	        if(zNodePath == zNodeWithCategoryListPath){
	        	var dataStr = data.toString('utf8');
	        	//split by comma and add it to array 
	        	primaryCategoriesList = [];

	        	myStringWithCommas.split(/\s*,\s*/).forEach(function(catName) {
    				primaryCategoriesList.push(catName);
				});

				log.info("updated primaryCategoriesList : " + primaryCategoriesList.toString());
	        }

	        
	    }
	);
}


// end of Zookeeper }





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

module.exports.getPrimaryCategoriesList = function(){
    return primaryCategoriesList;
};




const http = require('http')  
const port = 3000

const requestHandler = (request, response) => {  
  console.log(request.url)
  response.end('Hello Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    return console.log('something bad happened', err)
  }

  console.log(`server is listening on ${port}`)
})

