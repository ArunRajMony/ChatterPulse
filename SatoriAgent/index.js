/**
 * MailEngine
 */

console.log('NodeJS app\'s process\'s pid ' + process.pid);
var p_environment= process.env.NODE_ENV || "dev" // "production"
console.log("current environment : " + p_environment);


const restler = require('restler');	    // https://www.npmjs.com/package/restler
const RTM = require("satori-rtm-sdk");
const deepcopy = require("deepcopy");
const S = require('string');
const uuidv1 = require('uuid/v1');

const kafkaUtil = require("./msg_bus_util.js");
const configsUtil = require("./configs_util.js");






const log = configsUtil.getLogger();
const config = configsUtil.getConfig();

log.info('NodeJS process\'s pid ' + process.pid);


var rtm = new RTM(config.satori.rtm.endpoint, config.satori.rtm.appkey);


var filterQuery = "";

var buildQuery = function(){
	var queryCondition = ""

	var catList = configsUtil.getPrimaryCategoriesList();
	for(var i in catList){
		queryCondition += " description like '%" + catList[i] + "%'";
		if(i < (catList.length - 1))
			queryCondition += " OR ";
	}
	log.debug("derived valued for queryCondition : " + queryCondition);

	filterQuery = "select * from `big-rss` where " + queryCondition

	log.info("Generated filter Query : " + filterQuery)

};

buildQuery();



var common_ch_sub_id = "common_channel_subscription";

var common_ch_sub = rtm.subscribe(common_ch_sub_id, RTM.SubscriptionMode.SIMPLE, {
  filter: filterQuery
});



common_ch_sub.on('rtm/subscribe/error', onRTMSubscribeError);

common_ch_sub.on('enter-subscribed', function () {
  log.info('Subscribed to: ' + common_ch_sub.subscriptionId);
});

common_ch_sub.on("rtm/subscription/data", onSubscriptionData);

common_ch_sub.on('rtm/subscription/error', onRTMSubscribtionError);

common_ch_sub.on('leave-subscribed', function () {
  log.info('Subscription \'leave-subscribed\' for subscription : ' + common_ch_sub.subscriptionId);
});



function onSubscriptionData(pdu) {

	//log.debug("message received for subscription : " + pdu.body.subscription_id)

    pdu.body.messages.forEach(function (msg) {

      var newObj = deepcopy(msg);
	  newObj.categoryName = getCategoryNameForMsg(msg);
	  newObj.uuid = uuidv1();

	  log.addContext('request_id', newObj.uuid);
	  log.info("Got new message for category : " + newObj.categoryName)
	  log.debug('Received message : '+ JSON.stringify(msg));
	  log.debug("\tFeed URL : " + msg.feedURL)
	  log.debug("\tLink URL : " + msg.url)


	  log.debug("trying to send message to kafka");
	  kafkaUtil.sendMessage(newObj);
  	});
}



function onRTMSubscribeError(pdu){
	log.error('Failed to subscribe for subscription : ' + pdu.body.subscription_id   + ' RTM replied with the error ' +
      pdu.body.error + ': ' + pdu.body.reason);

}



function onRTMSubscribtionError(pdu){
  log.error('Subscription failed for subscription : ' + pdu.body.subscription_id   + ' RTM sent the unsolicited error ' +
      pdu.body.error + ': ' + pdu.body.reason);

}



// client enters 'connected' state
rtm.on("enter-connected", function() {
	log.info("RTM has enter-connected");
    //rtm.publish("xxxxx", {key: "value"});
});

// client receives any PDU and PDU is passed as a parameter
rtm.on("data", function(pdu) {
    if (pdu.action.endsWith("/error")) {
    	log.warn("PDU recevied for error, so going to restart RTM")
        rtm.restart();
    }
});

// start the client
rtm.start();



function getCategoryNameForMsg(msg){

	for(var i in config.categoryDetails.primaryCategories){
		var currCat = config.categoryDetails.primaryCategories[i];
		if(S(msg.description).contains(currCat))
			return currCat;
	}

	return null;
}






