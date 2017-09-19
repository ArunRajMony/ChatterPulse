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
var zkClient = zookeeper.createClient(config.zookeeper.zkHostsPortsConnectionString, { retries : 2 });

const zNodeWithCategoryListPath = config.zookeeper.pathOfzNodeHavingCategoryList;
log.info("zNodeWithCategoryListPath : %s ", zNodeWithCategoryListPath);

zkClient.once('connected', function () {
    log.info('Connected to the zookeeper server.');

    //check if znode for category details exist, if not create it
	zkClient.exists(zNodeWithCategoryListPath, zNodeModified, function (error, stat) {
	    if (error) {
	        log.error("'znode exists' check returned error for zNode '%s' : %s " ,zNodeWithCategoryListPath , error.stack);
	        return;
	    }

	    if (stat) {
	        log.info('zNode %s exists already with stat : %s', zNodeWithCategoryListPath,stat);
	        //TODO update the catlist.txt file here 
	    } else {
	        log.info('zNode \'%s\' does not exist, so going to create.',zNodeWithCategoryListPath);

	        zkClient.create(zNodeWithCategoryListPath, function (error) { // this create is throwing back an error, so better to creaate the znode using zookeper CLI before running this program
	        	if (error) {
	            	log.error('Failed to create zNode \'%s\' due to: %s.', zNodeWithCategoryListPath, JSON.stringify(error));
	            	return;
	        	} else {
	            	log.info('zNode: \'%s\' is successfully created.', zNodeWithCategoryListPath);
	        	}
    		});
	    }

	});

});

zkClient.connect();






function zNodeModified(event){
	log.info("Received zNode modified event : %s " , event.toString());
	//if(event.getType() == zookeeper.NODE_DATA_CHANGED && event.getPath() == zNodeWithCategoryListPath){
		log.info("category list needs to be updated");
		processUpdatedzNodeData(zNodeWithCategoryListPath);		
	//}
}


function processUpdatedzNodeData(zNodePath){
	zkClient.getData(
	    zNodePath,
	    zNodeModified,
	    function (error, data, stat) {
	        if (error) {
	            log.error("Error while trying to get data from zNode '%s' : %s" , zNodePath , error.stack);
	            return;
	        }

	        log.info('Got data: %s', data.toString('utf8'));

	        if(zNodePath == zNodeWithCategoryListPath){
	        	var dataStr = data.toString('utf8');
	        	//update file which has the categories list 
	        	fs.writeFileSync(config.categoryDetails.categoryListFileLocation, dataStr,{encoding : 'utf8'});

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

	var primaryCategoriesStr = fs.readFileSync(config.categoryDetails.categoryListFileLocation, {encoding : 'utf8'});

	primaryCategoriesList = [];

	primaryCategoriesStr.split(/\s*,\s*/).forEach(function(catName) {
    	primaryCategoriesList.push(catName);
	});

    return primaryCategoriesList;
};





const http = require('http')  
const port = 3000

const requestHandler = (request, response) => {  
  log.info(request.url)
  response.end('Hello from Node.js Server!')
}

const server = http.createServer(requestHandler)

server.listen(port, (err) => {  
  if (err) {
    return log.error('something bad happened while starting http server', err)
  }

  log.info('server is listening on %s' , port)
})

