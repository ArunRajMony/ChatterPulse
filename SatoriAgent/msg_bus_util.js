const kafka = require('kafka-node');
const configsUtil = require("./configs_util.js");



const log = configsUtil.getLogger();
const config = configsUtil.getConfig();

var HighLevelProducer = kafka.HighLevelProducer;
var Client = kafka.Client;

var client = new Client(config.kafka.brokerHostPort, config.kafka.clientName, {
  sessionTimeout: 300,
  spinDelay: 100,
  retries: 2
});


client.on('error', function(error) {
  log.error('error in connecting to kafka : ' + error);
  //TODO 
});



//create the producer 
var producer = new HighLevelProducer(client);

producer.on('ready', function() {
   log.info("kafka producer is ready")
});


producer.on('error', function(error) {
  log.error("kafka producer has error : "  + error);
});




/*
* public function to send message to kafka topic 
*/
module.exports.sendMessage = function(msg){

  log.addContext('request_id', msg.uuid);
  log.debug("Kafka producer has a new message to send");

  //log.debug("msg : " + JSON.stringify(msg));

	var payload = [{
	    topic: config.kafka.topicName, 
    	messages: JSON.stringify(msg),
    	attributes: 1 /* Use GZip compression for the payload */
  	}];

	producer.send(payload, function(error, result) {
    if (error) {
      log.error(error);
    } else {
      var formattedResult = result[0]
      log.info('Response from kafka : ', result)
    }
  });

};


