/*
  Continously scans for peripherals and prints out message when they enter/exit

    In range criteria:      RSSI < threshold
    Out of range criteria:  lastSeen > grace period

  based on code provided by: Mattias Ask (http://www.dittlof.com)
*/
var noble = require('../index');
var request = require('request');

var RSSI_THRESHOLD    = -90;
var EXIT_GRACE_PERIOD = 200; // milliseconds

var inRange = [];
//var beacons = ["e2:de:b4:99:2a:63", "de:51:98:e1:d2:28", "ed:f2:aa:cb:3a:0d"];
var test = 0;
var beacons = [];
var count_bus = 0;
function getBeaconInfo(){
	console.log('getBeaconInfo');
	request.post({url:'https://laravelsyd-fypfinalver.herokuapp.com/getAllBeaconInfo',form: {pi_id : 6}}, function(err,httpResponse,body) {
			//console.log('error:', err); // Print the error if one occurred
			//console.log(peripheral.address);
			//console.log('body:', body);
			//console.log('' + bName + ' in Range ' + '   ' + date); 
			var array = JSON.parse(body);
			console.log(array);
			for(a=0; a <array.length; a++)
			{
				if(array[a].beacon_mac != null)
				{
					beacons.push(array[a].beacon_mac);
				}
				
			}
			console.log('get All Bus Info');
			console.log('beacons_arraysize : ' + beacons.length);
			});
	
	
}

noble.on('discover', function(peripheral) {
  if (peripheral.rssi < RSSI_THRESHOLD) {
    // ignore
    return;
  }
  var id = peripheral.id;
  var entered = !inRange[id];
  
  
	if (beacons.length > 0)
	{
	
			for(b=0; b < beacons.length; b++)
			{
				
				if(peripheral.address == beacons[b])
				{
					if(entered)
					{
						count_bus++;
					}
					
					//console.log('Beacon_mac : ' + beacons[b]);
					
					inRange[id] = {peripheral: peripheral};
					inRange[id].timer = Date.now();
				
				}
			}
		
	}
});

setInterval(function () {
		
		
		
	for (var id in inRange) {
		
		var peripheral = inRange[id].peripheral;
		
		var bus_recorded_date = dateformat(inRange[id].timer);
		var current_date = dateformat(Date.now());
		console.log('Bus mac : ' + peripheral.address);
		console.log('time of recorded : ' + bus_recorded_date);
		console.log('Current Time : ' + current_date);
		timediff = Date.now() - inRange[id].timer;
		
		if (timediff > 15*1000)
		{
			request.post({url:'https://laravelsyd-fypfinalver.herokuapp.com/pi_insertlocation', form: {beacon_mac : peripheral.address, pi_id : 6}}, function(err,httpResponse,body)
					{ 
						//console.log('error:', err); // Print the error if one occurred
						//console.log(peripheral.address);
						//console.log('body:', body);
						//console.log('' + bName + ' in Range ' + '   ' + date); 
						
						console.log('inserted pi location');
					});
					
			delete inRange[id];
			console.log('time diff : ' + timediff);
			console.log('bus : ' + peripheral.address +' leave');
			count_bus--;
		}
		
		
	}
		  
		console.log('Bus in Base : ' + count_bus);  
		  
		  
		  
}, 30*1000); 



function dateformat(time)
{
	var d = new Date(time);
		  var dd = d.getDate();
		  var mm = d.getMonth()+1; //January is 0!
		  var yyyy = d.getFullYear();
		  var HH = d.getHours();
		  var min = d.getMinutes();
		  var ss = d.getSeconds();
		  var ms = d.getMilliseconds();
		  
		  if(dd<10) {
		dd = '0'+dd
	} 

	if(mm<10) {
		mm = '0'+mm
	} 
	if(HH<10) {
		HH = '0'+HH
	} 
	if(min<10) {
		min = '0'+min
	}
	if(ss<10) {
		ss = '0'+ss
	}
	if(ms<10) {
		ms = '0'+ms
	}		
  var date_string_time = HH + ":" + min + ":" + ss + ":" + ms;
  var date_string_date =dd + "/" + mm + "/" + yyyy;
  var date_string = date_string_date + '  ' + date_string_time;
  
  return date_string;
}



noble.on('stateChange', function(state) {
  if (state === 'poweredOn') {
	  getBeaconInfo();
    noble.startScanning([],true);
  } else {
	console.log("Stopped");
    noble.stopScanning();
  }
});
