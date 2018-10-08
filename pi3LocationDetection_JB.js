/*
  Continously scans for peripherals and prints out message when they enter/exit

    In range criteria:      RSSI < threshold
    Out of range criteria:  lastSeen > grace period

  based on code provided by: Mattias Ask (http://www.dittlof.com)

  Code Update Log
  07-10-2018: Replace search using array, with hashmap. Making search for detected beacons more efficient
              Added periodic update of beacons from the DB, so that when adding new beacons, the system does not need to be restarted.  

*/
var noble = require('../index');
var request = require('request');

var RSSI_THRESHOLD    = -90;
var EXIT_GRACE_PERIOD = 200; // milliseconds

var inRange = [];
//var beacons = ["e2:de:b4:99:2a:63", "de:51:98:e1:d2:28", "ed:f2:aa:cb:3a:0d"];
var test = 0;
var count_num_bus = 0;

//BEGIN 07-10-2018
//Using Hashmap to search for detected Bus Beacon_mac
var HashMap = require('hashmap');
var beaconMap = new HashMap();
var beaconTimestamp;
//END 07-10-2018

function getBeaconInfo(){
	console.log('getBeaconInfo');
	//BEGIN 07-10-2018
	//Clear all content in the beaconMap
	beaconMap.clear();
	//END 07-10-2018
	
	request.post({url:'https://laravelsyd-fypfinalver.herokuapp.com/getAllBeaconInfo',form: {pi_id : 5}}, function(err,httpResponse,body)
			{ 
			var array = JSON.parse(body);
			console.log(array);
			for(a=0; a <array.length; a++)
			{
				if(array[a].beacon_mac != null)
				{
					//beacons.push(array[a].beacon_mac);
					//BEGIN 07-10-2018
					//put beacons mac address into hashmap
					beaconMap.set(array[a].beacon_mac, new Date().getTime());
					//END 07-10-2018
				}				
			}
			console.log('get All Bus Info');
			//console.log('beacons_arraysize : ' + beacons.length);
			console.log('beacons_arraysize : ' + beaconMap.count());
			});
	//BEGIN 07-10-2018
	//Set the time when beacons mac addresses are retrieved from the database
	beaconTimestamp = new Date().getTime();
	//END 07-10-2018
}

noble.on('discover', function(peripheral) {
  if (peripheral.rssi < RSSI_THRESHOLD) {
    // ignore
    return;
  }
  var id = peripheral.id;
  var entered = !inRange[id];
  
  
    // BEGIN 07-10-2018
	// Change to check the beaconMap count
	//if (beacons.length > 0)
	if (beaconMap.count() > 0)
	// END 07-10-2018
	{
	
		if(entered)
		{
			//BEGIN 07-10-2018
			//Replace search of beacon by iterating through array, to use hashmap
			//for(b=0; b < beacons.length; b++)
			//{
			//	
			//	if(peripheral.address == beacons[b])
			//	{
			if (beaconMap.get(peripheral.address) != null) 
			{				
			//END 07-10-2018 
				request.post({url:'https://laravelsyd-fypfinalver.herokuapp.com/pi_insertlocation', form: {beacon_mac : peripheral.address, pi_id : 5}}, function(err,httpResponse,body)
					{ 
						console.log('inserted pi location');
					});
					
					console.log('Beacon_mac : ' + peripheral.address);					
					inRange[id] = {peripheral: peripheral};
					inRange[id].timer = Date.now();
					//BEGIN 07-10-2018
					//Update the time in the beaconMap, when was the last time the beacon is detected
					beaconMap.set(peripheral.address, new Date().getTime());
					//END 07-10-2018
			}
			
			//BEGIN 07-10-2018
			//Update Beacon Information periodically, e.g., once a day
			if (((new Date().getTime()) - beaconTimestamp) > 86400000)
			{
				getBeaconInfo();
			}
			//END 07-10-2018
		}
	}
});

setInterval(function () {
	
	for (var id in inRange) {
		
		var peripheral = inRange[id].peripheral;
		
		
		timediff = Date.now() - inRange[id].timer;
		console.log("timediff " + timediff);
		if (inRange[id].timer < (Date.now() - EXIT_GRACE_PERIOD)) {
			
			//BEGIN 07-10-2018 
			//Replace search through array with search through beaconMap
			//for(i=0; i < beacons.length; i++){
			//	if(peripheral.address == beacons[i]){
			if (beaconMap.get(peripheral.address)!= null) 
			{
				//console.log('"' + beacons[i] + '" exited ' + new Date());
				console.log('"' + peripheral.address + '" exited ' + new Date());
			//END 07-10-2018
				delete inRange[id];
			}
		}
	}		  	  
}, 30*1000); 







noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
	  getBeaconInfo();
    noble.startScanning([],true);
  } else {
	console.log("Stopped");
    noble.stopScanning();
  }
});
